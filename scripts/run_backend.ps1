# AURA - Start Backend Server
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Starting AURA FastAPI Backend Server..." -ForegroundColor Green
Write-Host " URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host " API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host " Health: http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

$env:PYTHONPATH = "backend"
& "backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
