from django.db import models
from common.models import BaseModel
from core.models import Batch
from users.models import User

class Notification(BaseModel):
    title = models.CharField(max_length=255)
    desc = models.TextField(blank=True, null=True)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    is_global = models.BooleanField(default=False)
    timestamp = models.CharField(max_length=50, blank=True, null=True)  # To preserve original sorting/formatting

    def __str__(self):
        return self.title

class AuditLog(models.Model):
    timestamp = models.CharField(max_length=50)  # YYYY-MM-DD HH:MM:SS
    user = models.CharField(max_length=255)  # Email string
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user} - {self.action} ({self.timestamp})"

class OtpLog(models.Model):
    mobile = models.CharField(max_length=20, db_index=True)
    otp = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mobile} - {self.otp}"
