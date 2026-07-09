import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

sys.path.insert(0, os.path.join(Path(__file__).resolve().parent.parent, "apps"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tuition_system.settings")

application = get_wsgi_application()
