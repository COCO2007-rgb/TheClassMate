from django.db import models
from common.models import BaseModel
from users.models import CoachingCenter
from core.models import Batch
from students.models import Student

class AttendanceSheet(BaseModel):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name="attendance_sheets")
    date = models.CharField(max_length=50, db_index=True)  # YYYY-MM-DD
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="attendance_sheets")

    class Meta:
        unique_together = ("batch", "date")

    def __str__(self):
        return f"Attendance {self.batch.name} - {self.date}"

class StudentAttendance(BaseModel):
    sheet = models.ForeignKey(AttendanceSheet, on_delete=models.CASCADE, related_name="records")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance_records")
    status = models.CharField(max_length=50, default="Present")  # Present, Absent, Late, Half Day

    def __str__(self):
        return f"{self.student.name} - {self.status}"
