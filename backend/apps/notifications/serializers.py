from rest_framework import serializers
from notifications.models import Notification, AuditLog, OtpLog
from common.models import RecycleBin

class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'desc', 'batch', 'is_global', 'timestamp']
        
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Expose 'global' key to the client to bypass python keyword restriction
        rep['global'] = instance.is_global
        return rep

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class OtpLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtpLog
        fields = '__all__'

class RecycleBinSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = RecycleBin
        fields = '__all__'
