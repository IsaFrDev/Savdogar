import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from django.db import connection

def inspect():
    print("--- Database Inspection ---")
    engine = settings.DATABASES['default']['ENGINE']
    print(f"Engine: {engine}")
    
    with connection.cursor() as cursor:
        if 'sqlite' in engine:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        else: # PostgreSQL
            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
            
        tables = [t[0] for t in cursor.fetchall()]
        print(f"Existing tables: {tables}")
        
        if 'django_migrations' in tables:
            cursor.execute("SELECT app, name, applied FROM django_migrations ORDER BY applied DESC LIMIT 20;")
            migrations = cursor.fetchall()
            print("\n--- Recent Migration History (Last 20) ---")
            for m in migrations:
                print(f"App: {m[0]}, Migration: {m[1]}, applied at: {m[2]}")
        else:
            print("\n'django_migrations' table NOT FOUND!")

if __name__ == "__main__":
    inspect()
