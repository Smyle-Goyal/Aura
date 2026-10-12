# AURA - Run Automated Test Suite
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Running AURA Automated Backend Test Suite..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$env:PYTHONPATH = "backend"
& "backend\venv\Scripts\pytest.exe" "backend\tests" -v
