from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import CoachingCenter

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(is_deleted=True, updated_at=timezone.now())

    def hard_delete(self):
        return super().delete()

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

class BaseModel(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="%(class)s_created",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="%(class)s_updated",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)

class RecycleBin(models.Model):
    item_id = models.CharField(max_length=100, db_index=True)
    type = models.CharField(max_length=100)  # "Student", "Batch", etc.
    name = models.CharField(max_length=255)
    deleted_at = models.CharField(max_length=50)  # String formatted date
    coaching_center = models.ForeignKey(CoachingCenter, on_delete=models.CASCADE, related_name="recycle_items", null=True, blank=True)

    def __str__(self):
        return f"{self.type} - {self.name} (Deleted)"
