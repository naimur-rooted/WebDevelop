@echo off
echo Starting Bilashbari backend and frontend...

:: Start backend
start cmd /k "cd backend && npm install && npm run dev"

:: Start frontend
start cmd /k "npm install && npm run dev"

echo Both servers are starting in separate terminals.
pause
