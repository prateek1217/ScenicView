@echo off
echo ========================================
echo Clean Installing Flight Seat Recommender
echo ========================================

echo.
echo Step 1: Cleaning backend...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 2: Installing backend dependencies...
call npm install

echo.
echo Step 3: Cleaning frontend...
cd frontend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
cd ..

echo.
echo Step 4: Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================
echo Clean Installation Complete!
echo ========================================
echo.
echo To start the application, run:
echo npm run dev
echo.
pause 