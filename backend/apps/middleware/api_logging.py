import time
from services.db import api_logs_col
from datetime import datetime

class APILoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time
        
        if request.path.startswith("/api/"):
            user = str(request.user) if hasattr(request, "user") and request.user.is_authenticated else "anonymous"
            api_logs_col.insert_one({
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "path": request.path,
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "user": user
            })
        return response
