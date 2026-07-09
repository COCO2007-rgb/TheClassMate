from django.http import JsonResponse
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

import random
import string
from datetime import datetime, timezone

from core.models import Batch, Settings
from users.models import CoachingCenter
from common.models import RecycleBin
from users.views import log_activity_db
from core.serializers import BatchSerializer, SettingsSerializer
from services import get_user_student

def index_view(request):
    return JsonResponse({"status": "ok", "message": "Tuition System API is running"})

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def settings_view(request):
    center = request.user.coaching_center
    if not center:
        # Fallback to first center if not assigned
        center = CoachingCenter.objects.first()
        if not center:
            center = CoachingCenter.objects.create(name="Main Coaching Center", status="active")

    if request.method == "GET":
        s = Settings.objects.filter(coaching_center=center).first()
        if not s:
            s = Settings.objects.create(
                coaching_center=center,
                name="Apex Coaching Academy",
                address="404 Academic Towers, Science City Road, Ahmedabad",
                phone="98765 43210",
                email="info@apexcoaching.com",
                upi_id="apexcoaching@okaxis",
                payee_name="Apex Academy LLC",
                gst="24AAAAA1111A1Z1",
                theme="indigo",
                brand_rgb="79, 70, 229",
                report_footer="Please review and discuss attendance issues with the principal."
            )
        serializer = SettingsSerializer(s)
        return Response(serializer.data)
        
    elif request.method == "POST":
        if request.user.role != "developer":
            return Response({"error": "Access denied. Only developers can modify platform settings."}, status=403)
            
        s = Settings.objects.filter(coaching_center=center).first()
        serializer = SettingsSerializer(s, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_activity_db(request.user.email, "Settings Changed", "Updated tuition meta parameters")
            return Response({"message": "Settings updated"})
        return Response(serializer.errors, status=400)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def batches_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            queryset = s_doc.batches.filter(is_archived=False)
        else:
            queryset = Batch.objects.filter(is_archived=False)
            if request.user.role != "developer":
                queryset = queryset.filter(coaching_center=request.user.coaching_center)
                
        serializer = BatchSerializer(queryset, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        if request.user.role not in ["teacher", "developer"]:
            return Response({"error": "Only administrators can create batches"}, status=403)
            
        data = request.data.copy()
        data["is_archived"] = False
        
        if "code" not in data or not data["code"]:
            code_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
            data["code"] = f"B-{code_suffix}"
            
        if "coaching_center" not in data or not data["coaching_center"]:
            if request.user.coaching_center:
                data["coaching_center"] = request.user.coaching_center.id
            else:
                first_cc = CoachingCenter.objects.first()
                data["coaching_center"] = first_cc.id if first_cc else None
            
        serializer = BatchSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                batch = serializer.save()
                log_activity_db(request.user.email, "Create Batch", f"Created batch {batch.name} with code {batch.code}")
                return Response(BatchSerializer(batch).data, status=201)
                
        return Response(serializer.errors, status=400)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def batch_detail_view(request, pk):
    s_doc = get_user_student(request.user)
    if s_doc:
        # Check if batch belongs to student
        if not s_doc.batches.filter(id=pk).exists():
            return Response({"error": "Access denied. Parents/students can only view their own batches."}, status=403)
            
    queryset = Batch.objects.all()
    if request.user.role != "developer" and request.user.role != "parent":
        queryset = queryset.filter(coaching_center=request.user.coaching_center)
        
    batch = queryset.filter(id=pk).first()
    if not batch:
        return Response({"error": "Batch not found or access denied"}, status=404)

    if request.method == "GET":
        serializer = BatchSerializer(batch)
        return Response(serializer.data)
        
    elif request.method == "PUT":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
            
        serializer = BatchSerializer(batch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_activity_db(request.user.email, "Batch Updated", f"Modified batch details for {pk}")
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
        
    elif request.method == "DELETE":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
            
        with transaction.atomic():
            batch.is_archived = True
            batch.save()
            
            # Record in RecycleBin
            RecycleBin.objects.create(
                item_id=str(batch.id),
                type="Batch",
                name=batch.name,
                deleted_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                coaching_center=batch.coaching_center
            )
            
            log_activity_db(request.user.email, "Batch Archived", f"Archived batch {pk}")
            return Response({"message": "Batch moved to recycle bin"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clone_batch_view(request, pk):
    if request.user.role != "teacher":
        return Response({"error": "Access denied"}, status=403)
        
    queryset = Batch.objects.all()
    if request.user.role != "developer":
        queryset = queryset.filter(coaching_center=request.user.coaching_center)
        
    source = queryset.filter(id=pk).first()
    if not source:
        return Response({"error": "Source batch not found or access denied"}, status=404)
        
    with transaction.atomic():
        code_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        cloned_batch = Batch.objects.create(
            name=f"{source.name} (Copy)",
            multiple_subjects=source.multiple_subjects,
            fees=source.fees,
            code=f"B-{code_suffix}",
            coaching_center=source.coaching_center
        )
        log_activity_db(request.user.email, "Batch Cloned", f"Cloned {source.name} to new ID {cloned_batch.id}")
        return Response({"id": str(cloned_batch.id)})


