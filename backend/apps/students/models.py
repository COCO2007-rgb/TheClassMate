from django.db import models
from common.models import BaseModel
from users.models import CoachingCenter

class Student(BaseModel):
    student_id = models.CharField(max_length=50, unique=True, db_column='student_id')
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="students", db_column='tuition_id')
    first_name = models.CharField(max_length=255, db_column='first_name', default="")
    surname = models.CharField(max_length=255, blank=True, null=True, db_column='surname')
    gender = models.CharField(max_length=20, default="Male", db_column='gender')
    dob = models.CharField(max_length=50, blank=True, null=True, db_column='dob')
    student_contact = models.CharField(max_length=50, blank=True, null=True, db_column='student_contact')
    parent_contact = models.CharField(max_length=50, blank=True, null=True, db_column='parent_contact')
    address = models.TextField(blank=True, null=True, db_column='address')
    joining_date = models.CharField(max_length=50, blank=True, null=True, db_column='joining_date')
    batch = models.ForeignKey('core.Batch', on_delete=models.SET_NULL, null=True, blank=True, related_name="students_list", db_column='batch_id')
    is_archived = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = 'student'

    def __str__(self):
        return f"{self.first_name} {self.surname or ''} ({self.student_id})"

    @property
    def name(self):
        return self.first_name

    @property
    def mobile(self):
        return self.student_contact

    @property
    def batches(self):
        # Mock Many-To-Many relationship to prevent any queries from breaking
        class MockQuerySet:
            def __init__(self, batch):
                self.batch = batch
            def all(self):
                return [self.batch] if self.batch else []
            def filter(self, *args, **kwargs):
                return self.all()
        return MockQuerySet(self.batch)

    @property
    def email(self):
        return f"{self.student_id.lower()}@tuition.com"

class Remark(BaseModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="remarks")
    teacher_name = models.CharField(max_length=255)
    text = models.TextField()
    date = models.CharField(max_length=50, db_index=True)  # YYYY-MM-DD
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="remarks")

    def __str__(self):
        return f"Remark for {self.student.name} by {self.teacher_name} ({self.date})"
