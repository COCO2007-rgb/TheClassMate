from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.db.models import Sum
from django.core.management import call_command

import json
from datetime import datetime, timezone
import random
import string

from users.models import CoachingCenter
from core.models import Batch, Exam, ExamMark, Homework, HomeworkSubmission, Settings
from students.models import Student, Remark
from attendance.models import AttendanceSheet, StudentAttendance
from fees.models import Payment
from notifications.models import AuditLog
from users.views import generate_jwt_token, log_activity_db

User = get_user_model()

@api_view(["POST"])
@permission_classes([AllowAny])
def developer_login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")
    
    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)
        
    user = User.objects.filter(email__iexact=email.strip(), role="developer").first()
    if not user or not user.check_password(password):
        return Response({"error": "Invalid developer credentials"}, status=401)
        
    token = generate_jwt_token(user)
    return Response({
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": "developer"
        }
    })

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def developer_centers_view(request):
    if request.user.role != "developer":
        return Response({"error": "Access denied. Developer permission required."}, status=403)
        
    if request.method == "GET":
        centers = CoachingCenter.objects.all()
        results = []
        for c in centers:
            student_count = Student.objects.filter(coaching_center=c, is_archived=False).count()
            batch_count = Batch.objects.filter(coaching_center=c, is_archived=False).count()
            total_collected_dict = Payment.objects.filter(coaching_center=c, status="paid").aggregate(total=Sum("amount"))
            total_collected = total_collected_dict["total"] or 0.0
            
            results.append({
                "id": str(c.id),
                "name": c.name,
                "status": c.status,
                "last_status_change": c.last_status_change.strftime("%Y-%m-%d %H:%M:%S") if c.last_status_change else "",
                "student_count": student_count,
                "batch_count": batch_count,
                "total_collected": total_collected
            })
        return Response(results)
        
    elif request.method == "POST":
        name = request.data.get("name")
        owner_name = request.data.get("owner_name")
        address = request.data.get("address")
        city = request.data.get("city")
        state = request.data.get("state")
        pincode = request.data.get("pincode")
        mobile = request.data.get("mobile")
        email = request.data.get("email")
        logo = request.data.get("logo")
        website = request.data.get("website")

        if not name or not owner_name or not address or not city or not state or not pincode or not mobile or not email:
            return Response({"error": "All required registration details must be filled"}, status=400)
            
        if CoachingCenter.objects.filter(name__iexact=name.strip()).exists():
            return Response({"error": "Coaching center with this name is already registered"}, status=400)
            
        clean_name = "".join(c for c in name.lower() if c.isalnum())
        admin_email = f"{clean_name}@theclassmate.in"
        
        if User.objects.filter(email__iexact=admin_email).exists():
            return Response({"error": f"Admin email '{admin_email}' is already registered"}, status=400)
            
        with transaction.atomic():
            center = CoachingCenter.objects.create(
                name=name,
                status="active"
            )
            
            # Setup settings for this center
            Settings.objects.create(
                coaching_center=center,
                name=name,
                address=address,
                phone=mobile,
                email=email,
                payee_name=owner_name
            )
            
            # Generate secure password
            upper = random.choice(string.ascii_uppercase)
            lower = random.choice(string.ascii_lowercase)
            digit = random.choice(string.digits)
            special = random.choice("!@#$%^&*()_+-=[]{}|;:,.<>?")
            all_chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
            remaining = "".join(random.choices(all_chars, k=8))
            
            pass_list = list(upper + lower + digit + special + remaining)
            random.shuffle(pass_list)
            admin_password = "".join(pass_list)
            
            User.objects.create_user(
                email=admin_email,
                password=admin_password,
                first_name=owner_name,
                last_name=name,
                role="teacher",
                must_change_password=True,
                coaching_center=center
            )
            
        return Response({
            "message": "Coaching center registered successfully",
            "coaching_center": {
                "id": str(center.id),
                "name": name,
                "status": "active"
            },
            "admin_credentials": {
                "email": admin_email,
                "password": admin_password
            }
        }, status=201)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def developer_center_toggle_view(request, pk):
    if request.user.role != "developer":
        return Response({"error": "Access denied"}, status=403)
        
    center = CoachingCenter.objects.filter(id=pk).first()
    if not center:
        return Response({"error": "Coaching center not found"}, status=404)
        
    new_status = "paused" if center.status == "active" else "active"
    center.status = new_status
    center.save()
    
    return Response({"message": f"Coaching center status set to {new_status}"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def developer_center_detail_view(request, pk):
    if request.user.role != "developer":
        return Response({"error": "Access denied"}, status=403)
        
    center = CoachingCenter.objects.filter(id=pk).first()
    if not center:
        return Response({"error": "Coaching center not found"}, status=404)
        
    students = Student.objects.filter(coaching_center=center, is_archived=False)
    batch_count = Batch.objects.filter(coaching_center=center, is_archived=False).count()
    payments = Payment.objects.filter(coaching_center=center).order_by("-date")
    
    last_payment = Payment.objects.filter(coaching_center=center, status="paid").order_by("-date").first()
    last_payment_date = last_payment.date if last_payment else None
    
    # Simple serialization helper
    def serialize_students(stus):
        return [{
            "id": str(s.id),
            "student_id": s.student_id,
            "name": s.name,
            "mobile": s.mobile,
            "email": s.email or ""
        } for s in stus]
        
    def serialize_payments(pays):
        return [{
            "id": str(p.id),
            "amount": p.amount,
            "date": p.date,
            "status": p.status,
            "receipt_id": p.receipt_id,
            "student_name": p.student.name
        } for p in pays]

    return Response({
        "coaching_center": {
            "id": str(center.id),
            "name": center.name,
            "status": center.status,
            "last_status_change": center.last_status_change.strftime("%Y-%m-%d %H:%M:%S") if center.last_status_change else ""
        },
        "students": serialize_students(students),
        "batch_count": batch_count,
        "payments": serialize_payments(payments),
        "last_payment_date": last_payment_date
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def developer_platform_stats_view(request):
    if request.user.role != "developer":
        return Response({"error": "Access denied"}, status=403)
        
    centers = CoachingCenter.objects.all()
    active_count = centers.filter(status="active").count()
    paused_count = centers.filter(status="paused").count()
    
    total_students = Student.objects.filter(is_archived=False).count()
    
    total_fees_collected_dict = Payment.objects.filter(status="paid").aggregate(total=Sum("amount"))
    total_fees_collected = total_fees_collected_dict["total"] or 0.0
    
    center_list = []
    for c in centers:
        c_collected_dict = Payment.objects.filter(coaching_center=c, status="paid").aggregate(total=Sum("amount"))
        c_collected = c_collected_dict["total"] or 0.0
        c_students = Student.objects.filter(coaching_center=c, is_archived=False).count()
        center_list.append({
            "id": str(c.id),
            "name": c.name,
            "status": c.status,
            "students_count": c_students,
            "total_collected": c_collected
        })
        
    return Response({
        "total_fee_collection": total_fees_collected,
        "total_students_count": total_students,
        "active_centers_count": active_count,
        "paused_centers_count": paused_count,
        "centers": center_list
    })

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def backup_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    if request.method == "GET":
        # Simple dumps for SQL tables
        dump = {
            "batches": [{"id": str(b.id), "name": b.name, "subject": b.subject, "schedule": b.schedule, "fees": b.fees, "code": b.code} for b in Batch.objects.all()],
            "students": [{"id": str(s.id), "student_id": s.student_id, "name": s.name, "mobile": s.mobile, "email": s.email or ""} for s in Student.objects.all()]
        }
        response = HttpResponse(json.dumps(dump, indent=2), content_type="application/json")
        response["Content-Disposition"] = "attachment; filename=tuition_backup.json"
        return response
        
    elif request.method == "POST":
        return Response({"message": "Database restore via json not supported in standard ORM. Please use sqlite/postgres management backups."})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_logs_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    logs = AuditLog.objects.all().order_by("-timestamp")
    return Response([{
        "timestamp": l.timestamp,
        "user": l.user,
        "action": l.action,
        "details": l.details
    } for l in logs])

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def developer_stats_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    return Response({
        "db_size_bytes": 1024 * 128,
        "collections": {
            "users": User.objects.count(),
            "batches": Batch.objects.count(),
            "students": Student.objects.count(),
            "attendance": AttendanceSheet.objects.count(),
            "payments": Payment.objects.count(),
            "api_logs": AuditLog.objects.count()
        },
        "subscriptions": [
            {"tuition_name": "Apex Coaching Academy", "status": "active", "plan": "enterprise", "expires": "2027-01-01"},
            {"tuition_name": "Zenith Physics Classes", "status": "active", "plan": "basic", "expires": "2026-12-15"}
        ],
        "server_load": {
            "cpu_percent": 8.5,
            "memory_usage_mb": 94.2,
            "active_connections": 2
        }
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def developer_db_clear_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    with transaction.atomic():
        AuditLog.objects.all().delete()
        Payment.objects.all().delete()
        StudentAttendance.objects.all().delete()
        AttendanceSheet.objects.all().delete()
        ExamMark.objects.all().delete()
        Exam.objects.all().delete()
        HomeworkSubmission.objects.all().delete()
        Homework.objects.all().delete()
        Student.objects.all().delete()
        Batch.objects.all().delete()
        Settings.objects.all().delete()
        User.objects.exclude(role="developer").delete()
        CoachingCenter.objects.all().delete()
        
    return Response({"message": "SQL database cleared successfully"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def developer_db_seed_view(request):
    if request.user.role not in ["teacher", "developer"]:
        return Response({"error": "Access denied"}, status=403)
        
    try:
        # Call management command programmatically!
        call_command("seed_db")
        return Response({"message": "Database successfully re-seeded via management command!"})
    except Exception as e:
        return Response({"error": f"Failed to seed: {str(e)}"}, status=500)
