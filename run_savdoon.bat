@echo off
echo ==========================================
echo    Savdoon AI Store Builder - Run Script
echo ==========================================

:: Kill any existing processes on ports 8000 and 5173
echo [1/4] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a 2>nul

:: Start Backend
echo [2/4] Starting Django Backend (Port 8000)...
cd Savdoon-backend
start cmd /k "title Savdoon-Backend && python manage.py runserver"

:: Start Frontend
echo [3/4] Starting Vite Frontend (Port 5173)...
cd ..
start cmd /k "title Savdoon-Frontend && npm run dev"

echo [4/4] All services are starting! 
echo.
echo ==========================================
echo    IMPORTANT: Database switched to SQLite
echo    This fixes encoding issues on Windows.
echo ==========================================
echo.
echo Login: admin@savdoon.uz
echo Pass:  Admin123!
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173
echo.
echo Wait 10-15 seconds for servers to initialize, then refresh your browser.
pause
