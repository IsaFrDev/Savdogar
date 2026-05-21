"""
Reset database and run fresh migrations
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from django.conf import settings

# Delete database file
db_path = settings.DATABASES['default']['NAME']
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"✅ Deleted {db_path}")

# Run migrations
from django.core.management import call_command

print("\n🔄 Running migrations...")
call_command('migrate', verbosity=1)

print("\n✅ Database reset complete!")
