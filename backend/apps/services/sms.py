import urllib.request
import urllib.parse
import base64
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Ensure the logs directory exists
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
SIMULATION_LOG_PATH = os.path.join(LOGS_DIR, "sms_simulation.log")

def load_env_file():
    # Search for .env in the backend folder and workspace root
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    paths = [
        os.path.join(backend_dir, ".env"),
        os.path.join(os.path.dirname(backend_dir), ".env")
    ]
    for path in paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip().strip("'\"")
            except Exception as e:
                logger.error(f"Failed to load env file {path}: {e}")

def send_sms_via_twilio(mobile, otp_code):
    load_env_file()
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_PHONE_NUMBER")
    
    # 1. Check if Twilio config is present
    if not account_sid or not auth_token or not from_number:
        # Fallback to simulation mode
        log_msg = f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] SIMULATED SMS TO {mobile} -> OTP: {otp_code}\n"
        try:
            with open(SIMULATION_LOG_PATH, "a") as f:
                f.write(log_msg)
        except Exception as e:
            logger.error(f"Failed to write simulation log: {e}")
            
        print("==================================================")
        print(f"[SMS SIMULATION MODE] Mobile: {mobile} -> OTP: {otp_code}")
        print(f"Log written to: {SIMULATION_LOG_PATH}")
        print("==================================================")
        return True, {
            "message": "OTP simulation logged successfully",
            "simulated": True
        }
        
    # 2. Production Twilio Integration
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    
    # Prefix phone number if required
    to_number = mobile.strip()
    if not to_number.startswith("+"):
        to_number = f"+91{to_number}" if len(to_number) == 10 else f"+{to_number}"
        
    data = urllib.parse.urlencode({
        "From": from_number,
        "To": to_number,
        "Body": f"Your TheClassMate OTP code is {otp_code}. Valid for 5 minutes."
    }).encode("utf-8")
    
    auth_str = f"{account_sid}:{auth_token}"
    auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
    
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Basic {auth_b64}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    try:
        with urllib.request.urlopen(req) as response:
            logger.info(f"SMS successfully sent to {to_number} via Twilio.")
            return True, {
                "message": "SMS sent successfully via Twilio",
                "simulated": False
            }
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_number} via Twilio: {e}")
        # In case of absolute Twilio API failure, log to simulation fallback so developers can still proceed
        log_msg = f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] TWILIO FAILURE FALLBACK TO {mobile} -> OTP: {otp_code} (Error: {str(e)})\n"
        try:
            with open(SIMULATION_LOG_PATH, "a") as f:
                f.write(log_msg)
        except Exception:
            pass
        return False, {
            "error": f"Twilio API Error: {str(e)}",
            "simulated": True
        }
