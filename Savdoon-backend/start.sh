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

# Optional one-time bootstrap (never commit real passwords — use Railway/Vercel env vars)
# SAVDOON_BOOTSTRAP=1 SAVDOON_ADMIN_EMAIL=... SAVDOON_ADMIN_PASSWORD=... SAVDOON_ADMIN_USERNAME=admin
if [ "${SAVDOON_BOOTSTRAP:-0}" = "1" ] && [ -n "${SAVDOON_ADMIN_EMAIL:-}" ] && [ -n "${SAVDOON_ADMIN_PASSWORD:-}" ]; then
  echo "Running guarded superuser bootstrap..."
  UNAME="${SAVDOON_ADMIN_USERNAME:-admin}"
  python3 manage.py shell <<'PYCODE'
import os
from django.contrib.auth import get_user_model
from stores.models import Store

User = get_user_model()
email = os.environ["SAVDOON_ADMIN_EMAIL"]
password = os.environ["SAVDOON_ADMIN_PASSWORD"]
username = os.environ.get("SAVDOON_ADMIN_USERNAME", "admin")
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(username, email, password, role="superadmin")
    print("Created superuser:", email)
else:
    print("Superuser email already exists, skipping create:", email)

owner = User.objects.filter(role="superadmin").first()
if owner and not Store.objects.filter(slug="savdoon").exists():
    Store.objects.create(
        owner=owner,
        name="Savdoon Main Store",
        slug="savdoon",
        status="approved",
        business_type="electronics",
        description="Official Savdoon store",
    )
    print("Created default savdoon store")
PYCODE
fi

echo "Starting Daphne on port ${PORT:-8000}..."
exec daphne savdoon.asgi:application --bind 0.0.0.0 --port "${PORT:-8000}"
