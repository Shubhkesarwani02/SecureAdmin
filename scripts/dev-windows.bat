@echo off
echo Starting Framtt Superadmin Development Environment...
echo.
echo Starting Frontend (React + Vite)...
start "Frontend" cmd /c "cd frontend && npm run dev"
echo.
echo Starting Backend (Express.js)...
start "Backend" cmd /c "cd backend && npm run dev"
echo.
echo Both servers are starting in separate windows:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo.
echo Press any key to exit...
pause > nul
