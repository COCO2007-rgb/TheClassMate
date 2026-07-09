import json
import jwt
from datetime import datetime, timedelta
from bson import ObjectId
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.http import HttpResponse, JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
def index_view(request):
    """Health check endpoint for root URL"""
    return JsonResponse({"status": "ok", "message": "Tuition System API is running"})


from tuition_system.db_connection import (
    users_col, settings_col, batches_col, students_col, attendance_col,
    payments_col, homework_col, exams_col, timetable_col, activity_logs_col,
    recycle_bin_col, log_activity_db
)

# Helper to serialize MongoDB documents
def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

def serialize_list(cursor):
    return [serialize_doc(doc) for doc in cursor]

def generate_jwt_token(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.utcnow() + settings.JWT_EXPIRATION_DELTA,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_user_student(request_user):
    """
    Helper to get linked student document if logged in user is a parent.
    Returns student doc or None.
    """
    if hasattr(request_user, "role") and request_user.role == "parent":
        u_doc = users_col.find_one({"_id": ObjectId(request_user.id)})
        if u_doc and u_doc.get("student_id"):
            return students_col.find_one({"_id": ObjectId(u_doc["student_id"])})
    return None

# ============================================
# AUTHENTICATION VIEWS
# ============================================
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email_or_id = request.data.get("email")
    password = request.data.get("password")
    
    if not email_or_id or not password:
        return Response({"error": "Email/ID and password required"}, status=status.HTTP_400_BAD_REQUEST)
        
    user = users_col.find_one({"email": email_or_id})
    if not user:
        # Check if they entered their Student ID
        student = students_col.find_one({"student_id": email_or_id.upper()})
        if student:
            user = users_col.find_one({"student_id": str(student["_id"])})
            
    if not user or not check_password(password, user["password"]):
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
    token = generate_jwt_token(user["_id"])
    log_activity_db(user["email"], "Login", "Successfully authenticated user session")
    
    return Response({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "role": user.get("role", "teacher")
        }
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def register_admin_view(request):
    # Setup initial admin if database is blank
    email = request.data.get("email")
    password = request.data.get("password")
    
    if not email or not password:
        return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)
        
    if users_col.find_one({"email": email}):
        return Response({"error": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
    user_id = users_col.insert_one({
        "email": email,
        "password": make_password(password),
        "first_name": request.data.get("first_name", "Jane"),
        "last_name": request.data.get("last_name", "Doe"),
        "role": "teacher"
    }).inserted_id
    
    return Response({"message": "Admin registered successfully", "id": str(user_id)})

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user_id = ObjectId(request.user.id)
    if request.method == "GET":
        user = users_col.find_one({"_id": user_id})
        return Response({
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", "")
        })
    elif request.method == "PUT":
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        users_col.update_one({"_id": user_id}, {"$set": {
            "first_name": first_name,
            "last_name": last_name
        }})
        log_activity_db(request.user.email, "Profile Updated", "Changed first/last names")
        return Response({"message": "Profile updated"})


# ============================================
# SETTINGS VIEWS
# ============================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def settings_view(request):
    if request.method == "GET":
        s = settings_col.find_one()
        if not s:
            # Default mock settings
            s = {
                "name": "Apex Coaching Academy",
                "address": "404 Academic Towers, Science City Road, Ahmedabad",
                "phone": "98765 43210",
                "email": "info@apexcoaching.com",
                "upi_id": "apexcoaching@okaxis",
                "payee_name": "Apex Academy LLC",
                "gst": "24AAAAA1111A1Z1",
                "theme": "indigo",
                "brand_rgb": "79, 70, 229",
                "report_footer": "Please review and discuss attendance issues with the principal."
            }
            settings_col.insert_one(s)
            s = settings_col.find_one()
        return Response(serialize_doc(s))
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Only administrators can update settings"}, status=403)
        data = request.data
        s = settings_col.find_one()
        if s:
            settings_col.update_one({"_id": s["_id"]}, {"$set": data})
        else:
            settings_col.insert_one(data)
        log_activity_db(request.user.email, "Settings Changed", "Updated tuition meta parameters")
        return Response({"message": "Settings updated"})


# ============================================
# BATCH VIEWS
# ============================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def batches_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            cursor = batches_col.find({"_id": {"$in": [ObjectId(bid) for bid in s_doc.get("batch_ids", [])]}, "is_archived": {"$ne": True}})
        else:
            cursor = batches_col.find({"is_archived": {"$ne": True}})
        return Response(serialize_list(cursor))
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Only administrators can create batches"}, status=403)
        data = request.data.copy()
        data["is_archived"] = False
        if "code" not in data:
            import random, string
            data["code"] = "B-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        batch_id = batches_col.insert_one(data).inserted_id
        log_activity_db(request.user.email, "Create Batch", f"Created batch {data.get('name')} with code {data['code']}")
        return Response({"id": str(batch_id), "code": data["code"]}, status=status.HTTP_201_CREATED)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def batch_detail_view(request, pk):
    b_id = ObjectId(pk)
    if request.method == "GET":
        b = batches_col.find_one({"_id": b_id})
        return Response(serialize_doc(b))
    elif request.method == "PUT":
        batches_col.update_one({"_id": b_id}, {"$set": request.data})
        log_activity_db(request.user.email, "Batch Updated", f"Modified batch details for {pk}")
        return Response({"message": "Batch updated"})
    elif request.method == "DELETE":
        # Archive rather than deletion (recycle bin pattern)
        batches_col.update_one({"_id": b_id}, {"$set": {"is_archived": True}})
        recycle_bin_col.insert_one({
            "item_id": pk,
            "type": "Batch",
            "name": batches_col.find_one({"_id": b_id}).get("name"),
            "deleted_at": datetime.utcnow().strftime("%Y-%m-%d")
        })
        log_activity_db(request.user.email, "Batch Archived", f"Archived batch {pk}")
        return Response({"message": "Batch moved to recycle bin"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clone_batch_view(request, pk):
    b_id = ObjectId(pk)
    source = batches_col.find_one({"_id": b_id})
    if not source:
        return Response({"error": "Source batch not found"}, status=404)
        
    clone = source.copy()
    del clone["_id"]
    clone["name"] = f"{source['name']} (Copy)"
    new_id = batches_col.insert_one(clone).inserted_id
    log_activity_db(request.user.email, "Batch Cloned", f"Cloned {source['name']} to new ID")
    return Response({"id": str(new_id)})


# ============================================
# STUDENT VIEWS
# ============================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def students_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            cursor = students_col.find({"_id": s_doc["_id"]})
        else:
            cursor = students_col.find({"is_archived": {"$ne": True}})
        return Response(serialize_list(cursor))
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        data = request.data.copy()
        mob = data.get("mobile")
        # Duplicate detection by mobile
        if mob and students_col.find_one({"mobile": mob, "is_archived": {"$ne": True}}):
            return Response({"error": "Student with this mobile number already exists"}, status=status.HTTP_400_BAD_REQUEST)

        data["is_archived"] = False
        data["student_id"] = "STU-" + str(1000 + students_col.count_documents({}) + 1)
        s_id = students_col.insert_one(data).inserted_id
        log_activity_db(request.user.email, "Student Added", f"Added student {data.get('name')}")
        return Response({"id": str(s_id)}, status=status.HTTP_201_CREATED)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def student_detail_view(request, pk):
    s_id = ObjectId(pk)
    if request.method == "GET":
        s = students_col.find_one({"_id": s_id})
        return Response(serialize_doc(s))
    elif request.method == "PUT":
        students_col.update_one({"_id": s_id}, {"$set": request.data})
        log_activity_db(request.user.email, "Student Updated", f"Updated student profile {pk}")
        return Response({"message": "Student updated"})
    elif request.method == "DELETE":
        students_col.update_one({"_id": s_id}, {"$set": {"is_archived": True}})
        recycle_bin_col.insert_one({
            "item_id": pk,
            "type": "Student",
            "name": students_col.find_one({"_id": s_id}).get("name"),
            "deleted_at": datetime.utcnow().strftime("%Y-%m-%d")
        })
        log_activity_db(request.user.email, "Student Archived", f"Moved student {pk} to bin")
        return Response({"message": "Student moved to recycle bin"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def promote_student_view(request, pk):
    s_id = ObjectId(pk)
    target_batch_id = request.data.get("target_batch_id")
    if not target_batch_id:
        return Response({"error": "Target batch ID required"}, status=400)
        
    students_col.update_one({"_id": s_id}, {"$set": {"batch_ids": [target_batch_id]}})
    log_activity_db(request.user.email, "Student Transferred", f"Promoted student {pk} to batch {target_batch_id}")
    return Response({"message": "Student promoted successfully"})


# ============================================
# ATTENDANCE VIEWS
# ============================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def attendance_view(request):
    if request.method == "GET":
        batch_id = request.query_params.get("batch_id")
        date = request.query_params.get("date")
        if not batch_id or not date:
            return Response({"error": "batch_id and date parameters required"}, status=400)
            
        s_doc = get_user_student(request.user)
        if s_doc and batch_id not in s_doc.get("batch_ids", []):
            return Response({"error": "Access denied"}, status=403)
            
        rec = attendance_col.find_one({"batch_id": batch_id, "date": date})
        serialized = serialize_doc(rec) if rec else {"records": []}
        if s_doc and "records" in serialized:
            serialized["records"] = [r for r in serialized["records"] if r.get("student_id") == str(s_doc["_id"])]
        return Response(serialized)
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        batch_id = request.data.get("batch_id")
        date = request.data.get("date")
        records = request.data.get("records") # list of {student_id, status}
        
        attendance_col.update_one(
            {"batch_id": batch_id, "date": date},
            {"$set": {"records": records}},
            upsert=True
        )
        log_activity_db(request.user.email, "Attendance Updated", f"Attendance logged for {batch_id} on {date}")
        return Response({"message": "Attendance recorded"})


# ============================================
# FEES & PAYMENTS VIEWS
# ============================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def payments_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            cursor = payments_col.find({"student_id": str(s_doc["_id"])}).sort("date", -1)
        else:
            cursor = payments_col.find().sort("date", -1)
        return Response(serialize_list(cursor))
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        data = request.data.copy()
        data["receipt_id"] = "REC-" + str(2000 + payments_col.count_documents({}) + 1)
        p_id = payments_col.insert_one(data).inserted_id
        log_activity_db(request.user.email, "Fee Paid", f"Collected fee payment: Receipt {data['receipt_id']}")
        return Response({"id": str(p_id), "receipt_id": data["receipt_id"]}, status=status.HTTP_201_CREATED)


# ============================================
# HOMEWORK & EXAMS VIEWS
# ============================================
@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def homework_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            cursor = homework_col.find({"batch_id": {"$in": s_doc.get("batch_ids", [])}}).sort("due", 1)
            serialized = serialize_list(cursor)
            for hw in serialized:
                hw["submissions"] = [sub for sub in hw.get("submissions", []) if sub.get("student_id") == str(s_doc["_id"])]
            return Response(serialized)
        else:
            cursor = homework_col.find().sort("due", 1)
            return Response(serialize_list(cursor))
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        hw_id = homework_col.insert_one(request.data).inserted_id
        log_activity_db(request.user.email, "Homework Added", "Assigned new homework assignment")
        return Response({"id": str(hw_id)}, status=status.HTTP_201_CREATED)
    elif request.method == "PUT":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        hw_id = request.data.get("id")
        if not hw_id:
            return Response({"error": "Homework ID required"}, status=400)
        data = request.data.copy()
        del data["id"]
        homework_col.update_one({"_id": ObjectId(hw_id)}, {"$set": data})
        log_activity_db(request.user.email, "Homework Updated", f"Modified details/submissions for homework {hw_id}")
        return Response({"message": "Homework updated"})

@api_view(["GET", "POST", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def exams_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            cursor = exams_col.find({"batch_id": {"$in": s_doc.get("batch_ids", [])}}).sort("date", -1)
            serialized = serialize_list(cursor)
            for ex in serialized:
                ex["marks"] = [m for m in ex.get("marks", []) if m.get("student_id") == str(s_doc["_id"])]
            return Response(serialized)
        else:
            cursor = exams_col.find().sort("date", -1)
            return Response(serialize_list(cursor))
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        ex_id = exams_col.insert_one(request.data).inserted_id
        log_activity_db(request.user.email, "Exam Scheduled", "Created exam event")
        return Response({"id": str(ex_id)}, status=status.HTTP_201_CREATED)
    elif request.method == "PUT":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        ex_id = request.data.get("id")
        if not ex_id:
            return Response({"error": "Exam ID required"}, status=400)
        data = request.data.copy()
        del data["id"]
        exams_col.update_one({"_id": ObjectId(ex_id)}, {"$set": data})
        log_activity_db(request.user.email, "Exam Updated", f"Modified details/marks for exam {ex_id}")
        return Response({"message": "Exam updated"})
    elif request.method == "DELETE":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        ex_id = request.query_params.get("id") or request.data.get("id")
        if not ex_id:
            return Response({"error": "Exam ID required"}, status=400)
        exams_col.delete_one({"_id": ObjectId(ex_id)})
        log_activity_db(request.user.email, "Exam Deleted", f"Deleted exam {ex_id}")
        return Response({"message": "Exam deleted successfully"})


# ============================================
# TIMETABLE VIEWS
# ============================================
@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def timetable_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            cursor = timetable_col.find({"batch_id": {"$in": s_doc.get("batch_ids", [])}})
        else:
            cursor = timetable_col.find()
        return Response(serialize_list(cursor))
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        t_id = timetable_col.insert_one(request.data).inserted_id
        log_activity_db(request.user.email, "Timetable Modified", "Scheduled class timetable slot")
        return Response({"id": str(t_id)})
    elif request.method == "DELETE":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=403)
        slot_id = request.data.get("slot_id") or request.query_params.get("slot_id")
        timetable_col.delete_one({"_id": ObjectId(slot_id)})
        return Response({"message": "Slot deleted"})


# ============================================
# RECYCLE BIN VIEWS
# ============================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recycle_bin_view(request):
    if request.user.role != "teacher":
        return Response({"error": "Access denied"}, status=403)
    cursor = recycle_bin_col.find()
    return Response(serialize_list(cursor))

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recycle_restore_view(request):
    if request.user.role != "teacher":
        return Response({"error": "Access denied"}, status=403)
    item_id = request.data.get("item_id")
    type_ = request.data.get("type")
    
    if type_ == "Student":
        students_col.update_one({"_id": ObjectId(item_id)}, {"$set": {"is_archived": False}})
    elif type_ == "Batch":
        batches_col.update_one({"_id": ObjectId(item_id)}, {"$set": {"is_archived": False}})
        
    recycle_bin_col.delete_one({"item_id": item_id})
    log_activity_db(request.user.email, "Data Restored", f"Restored {type_} {item_id}")
    return Response({"message": "Item restored successfully"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recycle_purge_view(request):
    if request.user.role != "teacher":
        return Response({"error": "Access denied"}, status=403)
    item_id = request.data.get("item_id")
    type_ = request.data.get("type")
    
    if type_ == "Student":
        students_col.delete_one({"_id": ObjectId(item_id)})
    elif type_ == "Batch":
        batches_col.delete_one({"_id": ObjectId(item_id)})
        
    recycle_bin_col.delete_one({"item_id": item_id})
    log_activity_db(request.user.email, "Data Purged", f"Permanently deleted {type_} {item_id}")
    return Response({"message": "Item permanently deleted"})


# ============================================
# BACKUPS VIEW
# ============================================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def backup_view(request):
    if request.user.role != "teacher":
        return Response({"error": "Access denied"}, status=403)
    if request.method == "GET":
        # Export database dump as JSON file
        dump = {
            "settings": serialize_list(settings_col.find()),
            "batches": serialize_list(batches_col.find()),
            "students": serialize_list(students_col.find()),
            "attendance": serialize_list(attendance_col.find()),
            "payments": serialize_list(payments_col.find()),
            "homework": serialize_list(homework_col.find()),
            "exams": serialize_list(exams_col.find()),
            "timetable": serialize_list(timetable_col.find())
        }
        response = HttpResponse(json.dumps(dump, indent=2), content_type="application/json")
        response["Content-Disposition"] = "attachment; filename=tuition_backup.json"
        return response
    elif request.method == "POST":
        # Restore JSON backup
        file_obj = request.FILES.get("backup_file")
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=400)
        try:
            data = json.loads(file_obj.read().decode("utf-8"))
            
            # Helper to clear & restore
            def restore_col(col, docs):
                col.delete_many({})
                for d in docs:
                    d_copy = d.copy()
                    if "id" in d_copy:
                        d_copy["_id"] = ObjectId(d_copy["id"])
                        del d_copy["id"]
                    col.insert_one(d_copy)

            if "settings" in data: restore_col(settings_col, data["settings"])
            if "batches" in data: restore_col(batches_col, data["batches"])
            if "students" in data: restore_col(students_col, data["students"])
            if "attendance" in data: restore_col(attendance_col, data["attendance"])
            if "payments" in data: restore_col(payments_col, data["payments"])
            if "homework" in data: restore_col(homework_col, data["homework"])
            if "exams" in data: restore_col(exams_col, data["exams"])
            if "timetable" in data: restore_col(timetable_col, data["timetable"])
            
            log_activity_db(request.user.email, "Data Restored", "Uploaded backup file")
            return Response({"message": "Database restore complete"})
        except Exception as e:
            return Response({"error": f"Failed to restore: {str(e)}"}, status=400)


# ============================================
# AUDIT LOGS VIEW
# ============================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_logs_view(request):
    if request.user.role != "teacher":
        return Response({"error": "Access denied"}, status=403)
    cursor = activity_logs_col.find().sort("timestamp", -1)
    return Response(serialize_list(cursor))


# ============================================
# EXCEL / CSV REPORT EXPORTERS
# ============================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def csv_export_students(request):
    if request.user.role != "teacher":
        return Response({"error": "Access denied"}, status=403)
    import csv
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = "attachment; filename=students_report.csv"
    
    writer = csv.writer(response)
    writer.writerow(["StudentID", "Name", "FatherName", "Mobile", "Email", "School", "AdmissionDate"])
    
    students = students_col.find({"is_archived": {"$ne": True}})
    for s in students:
        writer.writerow([
            s.get("student_id", ""),
            s.get("name", ""),
            s.get("father_name", ""),
            s.get("mobile", ""),
            s.get("email", ""),
            s.get("school", ""),
            s.get("admission_date", "")
        ])
    return response


# ============================================
# DASHBOARD STATS VIEW
# ============================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    s_doc = get_user_student(request.user)
    if s_doc:
        # Parent portal dashboard stats
        total_stus = 1
        total_bats = len(s_doc.get("batch_ids", []))
        collected = 0
        payments = payments_col.find({"student_id": str(s_doc["_id"])})
        for p in payments:
            collected += p["amount"]
        # Calculate parent's student attendance
        working = 0
        present = 0
        for att in attendance_col.find({"batch_id": {"$in": s_doc.get("batch_ids", [])}}):
            record = next((r for r in att.get("records", []) if r.get("student_id") == str(s_doc["_id"])), None)
            if record:
                working += 1
                if record["status"] in ["Present", "Late", "Half Day"]:
                    present += 1
        att_rate = f"{round((present / working) * 100)}%" if working > 0 else "100%"
        return Response({
            "total_students": total_stus,
            "total_batches": total_bats,
            "today_attendance": att_rate,
            "fees_collected": collected
        })

    total_stus = students_col.count_documents({"is_archived": {"$ne": True}})
    total_bats = batches_col.count_documents({"is_archived": {"$ne": True}})
    
    # Calculate attendance rate today
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    att = attendance_col.find_one({"date": today_str})
    att_rate = "100%"
    if att and len(att.get("records", [])) > 0:
        p_count = sum(1 for r in att["records"] if r["status"] == "Present")
        att_rate = f"{round((p_count / len(att['records'])) * 100)}%"
    else:
        att_rate = "94%" # Mock default fallback

    # Calculate fee collection this month
    collected = 0
    this_month = datetime.utcnow().strftime("%Y-%m")
    payments = payments_col.find({"date": {"$regex": f"^{this_month}"}})
    for p in payments:
        collected += p["amount"]
        
    return Response({
        "total_students": total_stus,
        "total_batches": total_bats,
        "today_attendance": att_rate,
        "fees_collected": collected
    })


# ============================================
# PUBLIC ENDPOINTS
# ============================================
@api_view(["GET"])
@permission_classes([AllowAny])
def public_batch_detail(request, code):
    batch = batches_col.find_one({"code": code, "is_archived": {"$ne": True}})
    if not batch:
        return Response({"error": "Invalid batch code"}, status=404)
    return Response(serialize_doc(batch))


@api_view(["POST"])
@permission_classes([AllowAny])
def public_register_student(request):
    data = request.data
    code = data.get("batch_code")
    if not code:
        return Response({"error": "Batch code required"}, status=400)
        
    batch = batches_col.find_one({"code": code, "is_archived": {"$ne": True}})
    if not batch:
        return Response({"error": "Invalid batch code"}, status=400)
        
    mob = data.get("mobile")
    if mob and students_col.find_one({"mobile": mob, "is_archived": {"$ne": True}}):
        return Response({"error": "Student with this mobile number already exists"}, status=400)
        
    email = data.get("email")
    if email and users_col.find_one({"email": email}):
        return Response({"error": "User with this email already exists"}, status=400)
        
    # Create the student document
    student_data = {
        "name": data.get("name"),
        "father_name": data.get("father_name", ""),
        "mother_name": data.get("mother_name", ""),
        "mobile": mob,
        "whatsapp": data.get("whatsapp", ""),
        "dob": data.get("dob", ""),
        "gender": data.get("gender", ""),
        "blood_group": data.get("blood_group", ""),
        "aadhaar": data.get("aadhaar", ""),
        "school": data.get("school", ""),
        "admission_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "address": data.get("address", ""),
        "batch_ids": [str(batch["_id"])],
        "is_archived": False,
        "student_id": "STU-" + str(1000 + students_col.count_documents({}) + 1)
    }
    
    student_id = students_col.insert_one(student_data).inserted_id
    
    password = mob if mob else "parent123"
    parent_email = email if email else f"{student_data['student_id'].lower()}@apextuition.com"
    
    users_col.insert_one({
        "email": parent_email,
        "password": make_password(password),
        "first_name": student_data["name"],
        "last_name": "(Parent/Student)",
        "role": "parent",
        "student_id": str(student_id)
    })
    
    log_activity_db(parent_email, "Self Registration", f"Student {student_data['name']} registered in batch {batch['name']}")
    
    return Response({
        "message": "Registration successful",
        "student_id": student_data["student_id"],
        "email": parent_email,
        "password_note": f"Use your mobile number '{password}' as your password to login."
    })
