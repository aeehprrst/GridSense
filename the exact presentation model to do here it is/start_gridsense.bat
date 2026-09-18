@echo off
echo Starting GridSense AI Auto-Setup and Launcher...
cd /d "%~dp0final kushagra"
powershell -ExecutionPolicy Bypass -File "start_gridsense.ps1"
pause
