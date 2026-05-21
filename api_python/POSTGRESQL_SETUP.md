# PostgreSQL Setup Guide for Bozorchi AI

## 1. Install PostgreSQL

### Windows
Download and install from https://www.postgresql.org/download/windows/
Or use Chocolatey: `choco install postgresql`

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## 2. Create the Database and User

```sql
-- Run as postgres superuser:
-- psql -U postgres

CREATE DATABASE bozorchi_db;
CREATE USER bozorchi_user WITH PASSWORD 'choose_a_strong_password_here';
ALTER ROLE bozorchi_user SET client_encoding TO 'utf8';
ALTER ROLE bozorchi_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bozorchi_user SET timezone TO 'Asia/Tashkent';
GRANT ALL PRIVILEGES ON DATABASE bozorchi_db TO bozorchi_user;
\q
```

---

## 3. Set DATABASE_URL in .env

Open `Bozorchi AI-backend/.env` and add:

```
DATABASE_URL=postgresql://bozorchi_user:choose_a_strong_password_here@localhost:5432/bozorchi_db
```

---

## 4. Run Migrations

```bash
cd Bozorchi AI-backend
python manage.py migrate
```

---

## 5. Create Superuser

```bash
python manage.py createsuperuser
```

---

## 6. (Optional) Migrate Data from SQLite

If you have existing data in SQLite that you want to move to PostgreSQL:

```bash
# Export from SQLite
python manage.py dumpdata --natural-foreign --natural-primary \
  --exclude=contenttypes --exclude=auth.permission \
  -o data_backup.json

# Switch DATABASE_URL to PostgreSQL in .env, then:
python manage.py migrate
python manage.py loaddata data_backup.json
```

---

## 7. Redis Setup (for WebSocket real-time features)

### Windows
Download from https://github.com/microsoftarchive/redis/releases
Or use WSL2 with Ubuntu.

### macOS
```bash
brew install redis
brew services start redis
```

### Ubuntu
```bash
sudo apt install redis-server
sudo systemctl start redis
```

Then add to `.env`:
```
REDIS_URL=redis://localhost:6379/0
```

---

## Production (Railway / Render / Heroku)

These platforms provide PostgreSQL and Redis as add-ons.
Set `DATABASE_URL` and `REDIS_URL` as environment variables in the platform dashboard.
The application will automatically use them.
