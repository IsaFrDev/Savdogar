import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from django.db import connection
from accounts.models import User

def check_db():
    print("--- DB Debug ---")
    print(f"Database Engine: {settings.DATABASES['default']['ENGINE']}")
    print(f"Database Name: {settings.DATABASES['default']['NAME']}")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables found: {[t[0] for t in tables]}")
        
    try:
        user_count = User.objects.count()
        print(f"User count: {user_count}")
    except Exception as e:
        print(f"Error accessing User model: {e}")

if __name__ == "__main__":
    check_db()
