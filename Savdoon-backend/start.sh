#!/bin/bash
# Savdoon startup (Railway / Docker-friendly)

set -e

echo "--- Savdoon backend startup ---"
date

echo "PWD: $(pwd)"
echo "DATABASE_URL set: $([ -n "${DATABASE_URL:-}" ] && echo yes || echo no)"

mkdir -p staticfiles media logs
chmod -R 777 logs media staticfiles 2>/dev/null || true

echo "Collect static..."
python3 manage.py collectstatic --noinput

echo "Migrate..."
python3 manage.py migrate --noinput

echo "Ensure default store slug=savdoon (no-op if exists or no superuser)..."
python3 manage.py ensure_savdoon_store || true

# 6. Superuser Synchronization
echo "Step: Superuser Sync"
python3 manage.py shell -c "
from accounts.models import User
from stores.models import Store
# Ensure admin
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        'admin', 
        'mansurovislombek130@gmail.com', 
        'admin123',
        role='superadmin'
    )
    print('Created admin superuser')

# Ensure Savdoon@gmail.com
if not User.objects.filter(email='Savdoon@gmail.com').exists():
    User.objects.create_superuser(
        'savdoon_admin', 
        'Savdoon@gmail.com', 
        'admin123',
        role='superadmin'
    )
    print('Created Savdoon@gmail.com superuser')
else:
    u = User.objects.get(email='Savdoon@gmail.com')
    u.set_password('admin123')
    u.role = 'superadmin'
    u.is_staff = True
    u.is_superuser = True
    u.save()
    print('Updated Savdoon@gmail.com password and roles')

# Ensure savdoon store for frontend
if owner := User.objects.filter(role='superadmin').first():
    if not Store.objects.filter(slug='savdoon').exists():
        Store.objects.create(
            owner=owner,
            name='Savdoon Main Store',
            slug='savdoon',
            status='approved',
            business_type='electronics',
            description='Official Savdoon store'
        )
        print('Created savdoon store')
" || echo "Superuser/Store sync failed"

echo "Starting Daphne on port ${PORT:-8000}..."
exec daphne savdoon.asgi:application --bind 0.0.0.0 --port "${PORT:-8000}"
