from django.db import models
from common.models import BaseModel
from users.models import CoachingCenter
from students.models import Student

class Payment(BaseModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="payments")
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="payments")
    amount = models.FloatField(default=0.0)
    date = models.CharField(max_length=50, db_index=True)  # YYYY-MM-DD
    due_date = models.CharField(max_length=50, blank=True, null=True)  # YYYY-MM-DD
    paid_date = models.CharField(max_length=50, blank=True, null=True)  # YYYY-MM-DD
    status = models.CharField(max_length=50, default="paid")  # paid, unpaid, pending
    payment_method = models.CharField(max_length=50, default="UPI")  # UPI, Cash, Online
    month = models.CharField(max_length=50, blank=True, null=True)
    receipt_id = models.CharField(max_length=100, unique=True)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.receipt_id} - {self.student.name} (₹{self.amount})"
