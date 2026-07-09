import jwt
from datetime import datetime
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from tuition_system.db_connection import users_col

class MongoUser:
    """
    Mock Django User representing a MongoDB User document
    """
    def __init__(self, user_doc):
        self.id = str(user_doc["_id"])
        self.email = user_doc["email"]
        self.role = user_doc.get("role", "teacher")
        self.first_name = user_doc.get("first_name", "")
        self.last_name = user_doc.get("last_name", "")
        self.coaching_center_id = user_doc.get("coaching_center_id")
        self.student_id = user_doc.get("student_id")
        self.is_authenticated = True

    def __str__(self):
        return self.email

class MongoJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Access token has expired")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid authentication token")

        # Query user in MongoDB
        from bson import ObjectId
        try:
            user_doc = users_col.find_one({"_id": ObjectId(payload["user_id"])})
        except Exception:
            raise exceptions.AuthenticationFailed("Invalid user ID reference")

        if not user_doc:
            raise exceptions.AuthenticationFailed("User record not found")

        cc_id = user_doc.get("coaching_center_id")
        if not cc_id and user_doc.get("role") == "parent" and user_doc.get("student_id"):
            from tuition_system.db_connection import students_col
            try:
                student = students_col.find_one({"_id": ObjectId(user_doc["student_id"])})
                if student:
                    cc_id = student.get("coaching_center_id")
                    user_doc["coaching_center_id"] = cc_id
            except Exception:
                pass
        if cc_id:
            from tuition_system.db_connection import coaching_centers_col
            try:
                center = coaching_centers_col.find_one({"_id": ObjectId(cc_id)})
                if center and center.get("status") == "paused":
                    raise exceptions.AuthenticationFailed("Coaching center access is temporarily paused. Please contact developer support.")
            except exceptions.AuthenticationFailed:
                raise
            except Exception:
                pass

        user = MongoUser(user_doc)
        return (user, token)
