@echo off
echo Starting Raaspass...

start "Backend API :3001" cmd /k "cd /d D:\HARSH\raaspass\backend && python main.py"
timeout /t 3 /nobreak >nul

start "Frontend :5173" cmd /k "cd /d D:\HARSH\raaspass\frontend\app && npm run dev"

echo.
echo Servers starting...
echo   Backend API  : http://localhost:3001/docs
echo   App          : http://localhost:5173
echo.
pause
