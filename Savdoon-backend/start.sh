#!/bin/bash
# Savdoon Ultimate Startup & Diagnosis Script

echo "--- STARTUP INITIATED ---"
date

# 1. Environment and Filesystem Info
echo "WHOAMI: $(whoami)"
echo "PWD: $(pwd)"
echo "LS ROOT:"
ls -F

# 2. Check Migrations existence
echo "CHECKING MIGRATIONS DIRECTORIES:"
ls -d accounts/migrations/ stores/migrations/ products/migrations/ || echo "Some migration directories are missing!"

echo "LISTING ACCOUNTS MIGRATIONS:"
ls -la accounts/migrations/

# 3. DB Settings Check
echo "DATABASE SETUP:"
echo "Using DATABASE_URL: ${DATABASE_URL:-None (Defaulting to SQLite)}"

# 4. Mandatory Sync/Migrate
echo "RUNNING DJANGO COMMANDS:"

# Force static directory creation
mkdir -p staticfiles media logs
chmod -R 777 logs media staticfiles

echo "Step: Collectstatic"
python3 manage.py collectstatic --noinput

echo "Step: Showmigrations"
python3 manage.py showmigrations

echo "Step: Makemigrations (Safety check)"
python3 manage.py makemigrations --noinput

echo "Step: Migrate"
python3 manage.py migrate --noinput || { echo "MIGRATION FAILED!"; exit 1; }

# 5. Inspection
echo "Step: Inspect DB"
python3 inspect_db.py

# 6. Superuser
echo "Step: Superuser"
python3 manage.py shell -c "from accounts.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'mansurovislombek130@gmail.com', 'admin123')" || echo "Admin check failed"

# 7. Final Check
echo "FILESYSTEM POST-SETUP:"
ls -l db_prod_v1.sqlite3 || echo "db_prod_v1.sqlite3 NOT CREATED!"
ls -d staticfiles || echo "staticfiles directory NOT FOUND!"

# 8. Start Server
echo "LAUNCHING DAPHNE (ASGI)..."
exec daphne savdoon.asgi:application --bind 0.0.0.0 --port $PORT
