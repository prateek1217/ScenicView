# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Green
npm install

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Green
cd frontend
npm install
cd ..

Write-Host "All dependencies installed successfully!" -ForegroundColor Green
Write-Host "You can now run: npm run dev" -ForegroundColor Yellow 