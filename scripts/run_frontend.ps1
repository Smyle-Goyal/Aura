# AURA - Start Frontend Vite Server
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Starting AURA React + Vite Frontend Server..." -ForegroundColor Green
Write-Host " Web UI: http://localhost:5173" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

Set-Location -Path "frontend"
npm run dev
