import jwt
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from students.models import Student
import csv

User = get_user_model()

@api_view(["GET"])
@permission_classes([AllowAny])
def csv_export_students(request):
    token = request.GET.get("token")
    if not token:
        return HttpResponse("Authentication token required", status=401)
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return HttpResponse("Invalid or expired authentication token", status=401)
        
    user = User.objects.filter(id=payload["user_id"]).first()
    if not user or user.role not in ["teacher", "developer"]:
        return HttpResponse("Access denied. Teachers only.", status=403)
        
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = "attachment; filename=students_report.csv"
    writer = csv.writer(response)
    writer.writerow(["StudentID", "Name", "FatherName", "Mobile", "Email", "School", "AdmissionDate"])
    
    queryset = Student.objects.filter(is_archived=False)
    if user.role != "developer":
        queryset = queryset.filter(coaching_center=user.coaching_center)
        
    for s in queryset:
        writer.writerow([
            s.student_id,
            s.name,
            s.father_name or "",
            s.mobile,
            s.email or "",
            s.school or "",
            s.created_at.strftime("%Y-%m-%d")
        ])
    return response
