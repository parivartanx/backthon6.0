param(
    [Parameter(Position=0)]
    [string]$Target = "help"
)

$ErrorActionPreference = "Stop"

# Resolve python / pip / pytest in venv or system
$VenvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
$VenvPip = Join-Path $PSScriptRoot ".venv\Scripts\pip.exe"
$VenvUvicorn = Join-Path $PSScriptRoot ".venv\Scripts\uvicorn.exe"
$VenvPytest = Join-Path $PSScriptRoot ".venv\Scripts\pytest.exe"

$PyCmd = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
$PipCmd = if (Test-Path $VenvPip) { $VenvPip } else { "pip" }
$UvicornCmd = if (Test-Path $VenvUvicorn) { $VenvUvicorn } else { "uvicorn" }
$PytestCmd = if (Test-Path $VenvPytest) { $VenvPytest } else { "pytest" }

switch ($Target.ToLower()) {
    "install" {
        Write-Host "==> [1/2] Installing backend Python dependencies..." -ForegroundColor Cyan
        & $PipCmd install -r (Join-Path $PSScriptRoot "requirements.txt")
        Write-Host "==> [2/2] Installing frontend npm dependencies..." -ForegroundColor Cyan
        Push-Location (Join-Path $PSScriptRoot "frontend")
        try {
            npm install
        } finally {
            Pop-Location
        }
        Write-Host "==> Installation complete!" -ForegroundColor Green
    }
    "dev-backend" {
        Write-Host "==> Starting FastAPI backend at http://localhost:8000..." -ForegroundColor Cyan
        & $UvicornCmd app.main:app --reload --port 8000
    }
    "dev-frontend" {
        Write-Host "==> Starting Next.js frontend at http://localhost:3000..." -ForegroundColor Cyan
        Push-Location (Join-Path $PSScriptRoot "frontend")
        try {
            npm run dev
        } finally {
            Pop-Location
        }
    }
    "build-frontend" {
        Write-Host "==> Building Next.js static export..." -ForegroundColor Cyan
        Push-Location (Join-Path $PSScriptRoot "frontend")
        try {
            npm run build
        } finally {
            Pop-Location
        }
    }
    "run" {
        Write-Host "==> Building frontend for production..." -ForegroundColor Cyan
        Push-Location (Join-Path $PSScriptRoot "frontend")
        try {
            npm run build
        } finally {
            Pop-Location
        }
        Write-Host "==> Starting unified production server on http://0.0.0.0:8000..." -ForegroundColor Cyan
        & $UvicornCmd app.main:app --host 0.0.0.0 --port 8000
    }
    "seed" {
        Write-Host "==> Initializing DB tables and extensions..." -ForegroundColor Cyan
        & $PyCmd (Join-Path $PSScriptRoot "scripts\seed_db.py")
    }
    "ingest-okf" {
        Write-Host "==> Ingesting OKF seed drug data..." -ForegroundColor Cyan
        & $PyCmd (Join-Path $PSScriptRoot "scripts\ingest_okf.py") --dir (Join-Path $PSScriptRoot "data\seed") --type drugs
    }
    "ingest-knowledge" {
        Write-Host "==> Ingesting clinical knowledge into vector store..." -ForegroundColor Cyan
        & $PyCmd (Join-Path $PSScriptRoot "scripts\ingest_knowledge.py")
    }
    "test" {
        Write-Host "==> Running pytest test suite..." -ForegroundColor Cyan
        $env:PYTHONPATH = $PSScriptRoot
        & $PytestCmd
    }
    default {
        Write-Host "AMR-Guard PowerShell Task Runner" -ForegroundColor Yellow
        Write-Host "Usage: .\run.ps1 <command>`n"
        Write-Host "Available Commands (Windows equivalent to Make):" -ForegroundColor Cyan
        Write-Host "  .\run.ps1 install          - Install backend & frontend packages"
        Write-Host "  .\run.ps1 dev-backend      - Start FastAPI backend (:8000)"
        Write-Host "  .\run.ps1 dev-frontend     - Start Next.js frontend (:3000)"
        Write-Host "  .\run.ps1 build-frontend   - Build frontend static export"
        Write-Host "  .\run.ps1 run              - Build frontend & run monolithic server"
        Write-Host "  .\run.ps1 seed             - Initialize database schema and vector extension"
        Write-Host "  .\run.ps1 ingest-okf       - Ingest OKF seed drug records"
        Write-Host "  .\run.ps1 ingest-knowledge - Ingest guidelines into PGVectorStore"
        Write-Host "  .\run.ps1 test             - Run all 56 pytest tests"
    }
}
