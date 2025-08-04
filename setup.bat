@echo off
echo Installing backend dependencies...
npm install

echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo All dependencies installed successfully!
echo You can now run: npm run dev
pause 