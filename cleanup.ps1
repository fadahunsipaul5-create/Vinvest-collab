# Development Cleanup Script for Sec-Insights-App
# Run this script from the project root directory
# This removes temporary/cache files while keeping development dependencies

Write-Host "🧹 Starting development cleanup..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "SilentlyContinue"

# Python cache files
Write-Host "Removing Python cache files..." -ForegroundColor Yellow
Get-ChildItem -Path backend -Include __pycache__ -Recurse -Force | Remove-Item -Recurse -Force
Get-ChildItem -Path backend -Include *.pyc -Recurse -Force | Remove-Item -Force
Remove-Item -Path __pycache__ -Recurse -Force
Write-Host "✅ Python cache cleaned" -ForegroundColor Green

# Generated/Static files
Write-Host "Removing generated files..." -ForegroundColor Yellow
Remove-Item -Path backend/staticfiles -Recurse -Force
Remove-Item -Path sec_frontend/dist -Recurse -Force
Write-Host "✅ Generated files removed" -ForegroundColor Green

# Unused directories
Write-Host "Removing unused directories..." -ForegroundColor Yellow
Remove-Item -Path backend/users -Recurse -Force
Remove-Item -Path curl-tester -Recurse -Force
Remove-Item -Path backend/db_migration -Recurse -Force
Write-Host "✅ Unused directories removed" -ForegroundColor Green

Write-Host ""
Write-Host "✨ Development cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Development dependencies (venv, node_modules) have been preserved." -ForegroundColor Yellow
Write-Host "They are excluded from git via .gitignore but needed for local development." -ForegroundColor Yellow
Write-Host ""
Write-Host "Cleaned:" -ForegroundColor Cyan
Write-Host "  ✓ Python cache files (__pycache__, *.pyc)" -ForegroundColor White
Write-Host "  ✓ Generated files (staticfiles, dist)" -ForegroundColor White
Write-Host "  ✓ Unused directories" -ForegroundColor White
Write-Host ""
Write-Host "Preserved:" -ForegroundColor Cyan
Write-Host "  ✓ backend/venv or backend/env (Python virtual environment)" -ForegroundColor White
Write-Host "  ✓ node_modules (Node.js dependencies)" -ForegroundColor White
Write-Host ""

