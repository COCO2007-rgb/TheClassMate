from django.db import models
from common.models import BaseModel
from users.models import CoachingCenter

class Batch(BaseModel):
    id = models.AutoField(primary_key=True, db_column='batch_id')
    name = models.CharField(max_length=255, db_column='batch_name')
    multiple_subjects = models.CharField(max_length=1000, default="", db_column='multiple_subjects')
    fees = models.FloatField(default=0.0)
    code = models.CharField(max_length=50, unique=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="batches")
    total_students = models.IntegerField(default=0, db_column='total_students')

    class Meta:
        db_table = 'batch'

    def __str__(self):
        return self.name

    @property
    def subject(self):
        return self.multiple_subjects


class Settings(models.Model):
    coaching_center = models.OneToOneField(CoachingCenter, on_delete=models.CASCADE, related_name="settings", null=True, blank=True)
    name = models.CharField(max_length=255, default="Apex Coaching Academy")
    address = models.TextField(default="404 Academic Towers, Science City Road, Ahmedabad")
    phone = models.CharField(max_length=50, default="98765 43210")
    email = models.EmailField(default="info@apexcoaching.com")
    upi_id = models.CharField(max_length=100, default="apexcoaching@okaxis")
    payee_name = models.CharField(max_length=255, default="Apex Academy LLC")
    gst = models.CharField(max_length=50, default="24AAAAA1111A1Z1")
    theme = models.CharField(max_length=50, default="indigo")
    brand_rgb = models.CharField(max_length=50, default="79, 70, 229")
    report_footer = models.TextField(default="Please review and discuss attendance issues with the principal.")

    def __str__(self):
        return f"Settings for {self.name}"


class Homework(BaseModel):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name="homeworks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    due = models.CharField(max_length=50)  # YYYY-MM-DD
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="homeworks")

    def __str__(self):
        return self.title


class HomeworkSubmission(BaseModel):
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name="homework_submissions")
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.CharField(max_length=50, blank=True, null=True)
    submitted_at = models.CharField(max_length=50, blank=True, null=True)  # YYYY-MM-DD
    marks = models.CharField(max_length=10, default="Pending")  # Grade or Marks or Pending
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.name} - {self.homework.title}"


class Exam(BaseModel):
    id = models.AutoField(primary_key=True, db_column='exam_id')
    test_name = models.CharField(max_length=255, db_column='test_name', default="")
    standard = models.CharField(max_length=100, db_column='standard', blank=True, null=True)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name="exams", db_column='batch_id')
    subject = models.CharField(max_length=255, db_column='subject', blank=True, null=True)
    total_marks = models.IntegerField(default=100, db_column='total_marks')
    passing_marks = models.IntegerField(default=33, db_column='passing_marks')
    exam_date = models.CharField(max_length=50, db_column='exam_date', default="2026-07-09")
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="exams")

    class Meta:
        db_table = 'exam'

    def __str__(self):
        return self.test_name

    # Compatibility properties
    @property
    def title(self):
        return self.test_name

    @property
    def max_marks(self):
        return self.total_marks

    @property
    def date(self):
        return self.exam_date


class ExamMark(BaseModel):
    id = models.AutoField(primary_key=True, db_column='exam_mark_id')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="marks", db_column='exam_id')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name="exam_marks", db_column='student_id')
    attendance = models.BooleanField(default=True, db_column='attendance')
    obtained_marks = models.FloatField(default=0.0, db_column='obtained_marks', null=True, blank=True)

    class Meta:
        db_table = 'exam_marks'

    def __str__(self):
        return f"{self.student.name} - {self.exam.test_name} ({self.obtained_marks}/{self.exam.total_marks})"

    # Compatibility properties
    @property
    def marks_obtained(self):
        return self.obtained_marks or 0.0

    @property
    def percentage(self):
        if self.exam and self.exam.total_marks > 0:
            val = self.obtained_marks or 0.0
            return (val / self.exam.total_marks) * 100
        return 0.0
