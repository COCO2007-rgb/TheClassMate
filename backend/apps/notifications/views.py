from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Q

from datetime import datetime, timezone

from notifications.models import Notification
from core.models import Batch
from users.views import log_activity_db
from notifications.serializers import NotificationSerializer
from services import get_user_student

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def notifications_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            # Parent/Student: filter by global=True OR their batches
            queryset = Notification.objects.filter(
                Q(is_global=True) | Q(batch__in=s_doc.batches.all())
            ).order_by("-timestamp")
        else:
            queryset = Notification.objects.all().order_by("-timestamp")
            
        serializer = NotificationSerializer(queryset, many=True)
        return Response(serializer.data)
        
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data.copy()
        
        # Maps global field to is_global
        if "global" in data:
            data["is_global"] = data["global"]
            
        data["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        
        serializer = NotificationSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                notification = serializer.save()
                log_activity_db(request.user.email, "Notification Sent", f"Broadcast notification: {notification.title}")
                return Response(NotificationSerializer(notification).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
