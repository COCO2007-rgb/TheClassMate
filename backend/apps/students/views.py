from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from students.models import Student
from core.models import Batch
from common.models import RecycleBin
from users.views import log_activity_db
from students.serializers import StudentSerializer
from services import get_user_student

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def students_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            # If student/parent, only return their own student record
            queryset = Student.objects.filter(id=s_doc.id)
        else:
            queryset = Student.objects.filter(is_archived=False)
            if request.user.role != "developer":
                queryset = queryset.filter(coaching_center=request.user.coaching_center)
        
        serializer = StudentSerializer(queryset, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        mobile = request.data.get("mobile")
        
        # Check uniqueness of mobile in the current center
        queryset = Student.objects.filter(mobile=mobile, is_archived=False)
        if request.user.role != "developer":
            queryset = queryset.filter(coaching_center=request.user.coaching_center)
            
        if mobile and queryset.exists():
            return Response({"error": "Student with this mobile number already exists in your coaching center"}, status=status.HTTP_400_BAD_REQUEST)
            
        data = request.data.copy()
        
        # Generate student ID with coaching center prefix
        cc = request.user.coaching_center
        prefix = cc.roll_number_prefix.strip() if (cc and cc.roll_number_prefix) else "STU"
        
        # Find maximum existing sequence number for this prefix
        existing_sids = Student.all_objects.filter(coaching_center=cc, student_id__startswith=prefix).values_list("student_id", flat=True)
        max_num = 0
        for sid in existing_sids:
            suffix = sid[len(prefix):]
            if suffix.isdigit():
                max_num = max(max_num, int(suffix))
        
        next_num = max_num + 1
        data["student_id"] = f"{prefix}{next_num:04d}"
        
        if "coaching_center" not in data or not data["coaching_center"]:
            data["coaching_center"] = request.user.coaching_center.id if request.user.coaching_center else None
            
        serializer = StudentSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                student = serializer.save()
                
                # Handle single batch ForeignKey relation
                batch_ids = request.data.get("batch_ids", [])
                if batch_ids:
                    student.batch = Batch.objects.filter(id=batch_ids[0]).first()
                    student.save()
                
                log_activity_db(request.user.email, "Student Added", f"Added student {student.name}")
                return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def student_detail_view(request, pk):
    s_doc = get_user_student(request.user)
    if s_doc and str(s_doc.id) != pk:
        return Response({"error": "Access denied. Parents/students can only view their own student records."}, status=status.HTTP_403_FORBIDDEN)
        
    queryset = Student.objects.all()
    if request.user.role != "developer" and request.user.role != "parent":
        queryset = queryset.filter(coaching_center=request.user.coaching_center)
    
    student = queryset.filter(id=pk).first()
    if not student:
        return Response({"error": "Student not found or access denied"}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == "GET":
        serializer = StudentSerializer(student)
        return Response(serializer.data)
        
    elif request.method == "PUT":
        if request.user.role == "teacher":
            new_mobile = request.data.get("mobile")
            new_email = request.data.get("email")
            if new_mobile is not None and new_mobile != student.mobile:
                return Response({"error": "Tuition Admin cannot change critical account details (mobile number). Only the developer can update these details from the backend."}, status=status.HTTP_400_BAD_REQUEST)
            if new_email is not None and new_email != student.email:
                return Response({"error": "Tuition Admin cannot change critical account details (email). Only the developer can update these details from the backend."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                updated_student = serializer.save()
                
                # Handle single batch ForeignKey relation on update
                batch_ids = request.data.get("batch_ids")
                if batch_ids is not None:
                    if batch_ids:
                        updated_student.batch = Batch.objects.filter(id=batch_ids[0]).first()
                    else:
                        updated_student.batch = None
                    updated_student.save()
                
                log_activity_db(request.user.email, "Student Updated", f"Updated student profile {pk}")
                return Response(StudentSerializer(updated_student).data)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == "DELETE":
        with transaction.atomic():
            student.is_archived = True
            student.save()
            
            # Record in RecycleBin
            from datetime import datetime, timezone
            RecycleBin.objects.create(
                item_id=str(student.id),
                type="Student",
                name=student.name,
                deleted_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                coaching_center=student.coaching_center
            )
            
            log_activity_db(request.user.email, "Student Archived", f"Moved student {pk} to bin")
            return Response({"message": "Student moved to recycle bin"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def promote_student_view(request, pk):
    target_batch_id = request.data.get("target_batch_id")
    if not target_batch_id:
        return Response({"error": "Target batch ID required"}, status=status.HTTP_400_BAD_REQUEST)
        
    queryset = Student.objects.filter(is_archived=False)
    if request.user.role != "developer":
        queryset = queryset.filter(coaching_center=request.user.coaching_center)
        
    student = queryset.filter(id=pk).first()
    if not student:
        return Response({"error": "Student not found or access denied"}, status=status.HTTP_404_NOT_FOUND)
        
    batch_queryset = Batch.objects.filter(is_archived=False)
    if request.user.role != "developer":
        batch_queryset = batch_queryset.filter(coaching_center=request.user.coaching_center)
        
    target_batch = batch_queryset.filter(id=target_batch_id).first()
    if not target_batch:
        return Response({"error": "Target batch not found or access denied"}, status=status.HTTP_404_NOT_FOUND)
        
    with transaction.atomic():
        student.batch = target_batch
        student.save()
        log_activity_db(request.user.email, "Student Transferred", f"Promoted student {pk} to batch {target_batch_id}")
        return Response({"message": "Student promoted successfully"})
