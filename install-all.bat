@echo off
echo ========================================
echo Installing Flight Seat Recommender
echo ========================================

echo.
echo Step 1: Installing backend dependencies...
call npm install

echo.
echo Step 2: Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start the application, run:
echo npm run dev
echo.
echo This will start:
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:3000
echo.
pause 