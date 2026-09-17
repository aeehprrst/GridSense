# GridSense — Launch Script (PowerShell)
# Starts both the FastAPI backend and the Vite frontend dev server.

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

# ─── Locate Python ─────────────────────────────────────────────────────
$PYTHON = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $PYTHON) {
    $PYTHON = "python"
}


# ─── Ensure Node.js is on PATH ─────────────────────────────────────────
$env:Path = "C:\Program Files\nodejs;" + $env:Path

# ─── Start backend (FastAPI / Uvicorn) ─────────────────────────────────
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "  │    GridSense — Predict • Explain • Act   │" -ForegroundColor Cyan
Write-Host "  └─────────────────────────────────────────┘" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] Starting backend (FastAPI) on http://localhost:8000 ..." -ForegroundColor Yellow

$backendJob = Start-Job -ScriptBlock {
    param($python, $root)
    Set-Location $root
    & $python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload 2>&1
} -ArgumentList $PYTHON, $ROOT

Start-Sleep -Seconds 3

# ─── Start frontend (Next.js dev server) ───────────────────────────────
Write-Host "[2/2] Starting frontend (Next.js) on http://localhost:3000 ..." -ForegroundColor Yellow

$frontendJob = Start-Job -ScriptBlock {
    param($root)
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
    Set-Location $root
    & cmd.exe /c "npm run dev" 2>&1
} -ArgumentList $ROOT

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "  Dashboard:  http://localhost:3000" -ForegroundColor Green
Write-Host "  API Docs:   http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor DarkGray
Write-Host ""

# ─── Tail logs until user presses Ctrl+C ───────────────────────────────
try {
    while ($true) {
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue 2>$null | ForEach-Object { Write-Host "[backend] $_" -ForegroundColor DarkCyan }
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue 2>$null | ForEach-Object { Write-Host "[frontend] $_" -ForegroundColor DarkMagenta }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nShutting down..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "Done." -ForegroundColor Green
}
