from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class CoachingCenter(models.Model):
    id = models.AutoField(primary_key=True, db_column='tuition_id')
    name = models.CharField(max_length=255, db_column='coaching_name')
    status = models.CharField(max_length=50, default="active")  # active, paused
    roll_number_prefix = models.CharField(max_length=10, default="STU", db_column='coaching_short_code')
    logo = models.CharField(max_length=255, blank=True, null=True, db_column='logo')
    last_status_change = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tuition'

    def __str__(self):
        return self.name

    @property
    def coaching_name(self):
        return self.name

    @property
    def coaching_short_code(self):
        return self.roll_number_prefix

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "developer")
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=50, default="teacher")  # developer, teacher, parent, student, etc.
    mobile = models.CharField(max_length=20, blank=True, null=True)
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    student_id = models.CharField(max_length=255, blank=True, null=True)  # link string for parent to student
    must_change_password = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class Teacher(models.Model):
    id = models.AutoField(primary_key=True, db_column='teacher_id')
    name = models.CharField(max_length=255, db_column='name')
    subject = models.CharField(max_length=255, db_column='subject')
    phone = models.CharField(max_length=50, db_column='phone')
    qualification = models.CharField(max_length=255, db_column='qualification')
    experience = models.CharField(max_length=50, db_column='experience')
    status = models.CharField(max_length=50, default="Active", db_column='status')
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="teachers", db_column='tuition_id')

    class Meta:
        db_table = 'teacher'

    def __str__(self):
        return f"{self.name} ({self.subject})"
