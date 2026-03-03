@echo off
echo ========================================
echo   Drishyamitra - AI Photo Management
echo ========================================
echo.

echo [1/4] Checking environment...
if not exist "backend\.env" (
    echo ERROR: backend\.env not found!
    echo Please run: copy backend\.env.example backend\.env
    pause
    exit /b 1
)

echo [2/4] Starting Backend Server...
echo.
start "Drishyamitra Backend" cmd /k "cd backend && python -m venv venv 2>nul && venv\Scripts\activate && pip install -q -r requirements.txt && echo Backend starting on http://localhost:5000 && python app.py"

echo Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo [3/4] Starting Frontend Server...
echo.
start "Drishyamitra Frontend" cmd /k "cd frontend && npm install && echo Frontend starting on http://localhost:3000 && npm run dev"

echo.
echo [4/4] Done!
echo.
echo ========================================
echo   Application Starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Two terminal windows will open:
echo   1. Backend (Python/Flask)
echo   2. Frontend (React/Vite)
echo.
echo Wait 30 seconds for everything to start,
echo then open: http://localhost:3000
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:3000
