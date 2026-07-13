from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from common.models import RecycleBin
from students.models import Student
from core.models import Batch
from users.views import log_activity_db
from notifications.serializers import RecycleBinSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recycle_bin_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    queryset = RecycleBin.objects.all()
    if request.user.role != "developer":
        queryset = queryset.filter(coaching_center=request.user.coaching_center)
        
    serializer = RecycleBinSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recycle_restore_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    item_id = request.data.get("item_id")
    type_ = request.data.get("type")
    
    if not item_id or not type_:
        return Response({"error": "item_id and type are required"}, status=400)
        
    with transaction.atomic():
        if type_ == "Student":
            student = Student.all_objects.filter(id=item_id).first()
            if student:
                student.is_archived = False
                student.save()
        elif type_ == "Batch":
            batch = Batch.all_objects.filter(id=item_id).first()
            if batch:
                batch.is_archived = False
                batch.save()
                
        # Delete from RecycleBin
        RecycleBin.objects.filter(item_id=item_id, type=type_).delete()
        
        log_activity_db(request.user.email, "Data Restored", f"Restored {type_} {item_id}")
        return Response({"message": "Item restored successfully"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recycle_purge_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    item_id = request.data.get("item_id")
    type_ = request.data.get("type")
    
    if not item_id or not type_:
        return Response({"error": "item_id and type are required"}, status=400)
        
    with transaction.atomic():
        if type_ == "Student":
            # Hard delete
            Student.all_objects.filter(id=item_id).delete()
        elif type_ == "Batch":
            # Hard delete
            Batch.all_objects.filter(id=item_id).delete()
            
        # Delete from RecycleBin
        RecycleBin.objects.filter(item_id=item_id, type=type_).delete()
        
        log_activity_db(request.user.email, "Data Purged", f"Permanently deleted {type_} {item_id}")
        return Response({"message": "Item permanently deleted"})
