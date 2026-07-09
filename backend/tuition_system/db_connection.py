import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Read config from environment variables
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "tuition_db")

try:
    from pymongo import MongoClient
    # Use 2000ms timeout to fail fast if MongoDB is not running locally
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Check if we can reach the server
    client.admin.command('ping')
    db = client[MONGO_DB_NAME]
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"MongoDB not available: {e}. Falling back to in-memory mongomock database.")
    import mongomock
    client = mongomock.MongoClient()
    db = client[MONGO_DB_NAME]

# Expose specific collection helpers for access
coaching_centers_col = db["coaching_centers"]
users_col = db["users"]
settings_col = db["settings"]
batches_col = db["batches"]
students_col = db["students"]
attendance_col = db["attendance"]
fees_col = db["fees"]
payments_col = db["payments"]
homework_col = db["homework"]
exams_col = db["exams"]
timetable_col = db["timetable"]
notifications_col = db["notifications"]
activity_logs_col = db["activity_logs"]
recycle_bin_col = db["recycle_bin"]
otp_logs_col = db["otp_logs"]

# Create Indexes
try:
    students_col.create_index("mobile")
    students_col.create_index("coaching_center_id")
    batches_col.create_index("code")
    batches_col.create_index("coaching_center_id")
    payments_col.create_index("coaching_center_id")
    payments_col.create_index("student_id")
    coaching_centers_col.create_index("name")
    otp_logs_col.create_index([("mobile", 1), ("created_at", -1)])
except Exception as idx_err:
    print(f"Error creating indexes: {idx_err}")

# Auto Migration
def run_db_migration():
    from datetime import datetime
    try:
        default_center = coaching_centers_col.find_one({"name": "Main Coaching Center"})
        if not default_center:
            center_id = coaching_centers_col.insert_one({
                "name": "Main Coaching Center",
                "status": "active",
                "last_status_change": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }).inserted_id
            default_center = coaching_centers_col.find_one({"_id": center_id})
        
        center_str_id = str(default_center["_id"])

        # Ensure default developer exists
        dev_email = "dev@apextuition.com"
        dev_user = users_col.find_one({"email": dev_email})
        if not dev_user:
            from django.contrib.auth.hashers import make_password
            users_col.insert_one({
                "email": dev_email,
                "password": make_password("devpassword123"),
                "first_name": "Super",
                "last_name": "Admin",
                "role": "developer"
            })
            print("Default developer account created successfully in db_connection.")
        
        users_col.update_many(
            {"role": {"$ne": "parent"}, "coaching_center_id": {"$exists": False}},
            {"$set": {"coaching_center_id": center_str_id}}
        )
        batches_col.update_many(
            {"coaching_center_id": {"$exists": False}},
            {"$set": {"coaching_center_id": center_str_id}}
        )
        students_col.update_many(
            {"coaching_center_id": {"$exists": False}},
            {"$set": {"coaching_center_id": center_str_id}}
        )
        payments_col.update_many(
            {"coaching_center_id": {"$exists": False}},
            {"$set": {"coaching_center_id": center_str_id}}
        )
        
        for p in payments_col.find():
            updates = {}
            if "status" not in p:
                updates["status"] = "paid"
            if "amount" in p and not isinstance(p["amount"], float) and not isinstance(p["amount"], int):
                try:
                    updates["amount"] = float(p["amount"])
                except Exception:
                    pass
            if "due_date" not in p:
                updates["due_date"] = p.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
            if "paid_date" not in p:
                updates["paid_date"] = p.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
                
            if updates:
                payments_col.update_one({"_id": p["_id"]}, {"$set": updates})
                
        print("Database schema normalized and migration executed successfully in main db_connection.")
    except Exception as mig_err:
        print(f"Error during db migration: {mig_err}")

run_db_migration()

def log_activity_db(user, action, details):
    """
    Utility helper to log system actions to the MongoDB ActivityLog collection
    """
    from datetime import datetime
    activity_logs_col.insert_one({
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "user": user,
        "action": action,
        "details": details
    })
