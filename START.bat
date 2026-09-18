@echo off
echo ============================================================
echo   POWER PLANT PREDICTIVE MAINTENANCE SYSTEM
echo   Starting all components...
echo ============================================================
echo.

echo [1/3] Checking Python packages...
pip install paho-mqtt scikit-learn pandas numpy xgboost joblib fastapi uvicorn --quiet

echo.
echo [2/3] Starting Data Publisher (NASA Dataset Replay)...
start "DATA PUBLISHER" cmd /k "set PYTHONIOENCODING=utf-8 && python data_publisher.py"

echo.
echo [3/3] Starting Backend API Server...
start "BACKEND API" cmd /k "set PYTHONIOENCODING=utf-8 && python backend_server.py"

timeout /t 3 >nul

echo.
echo [4/4] Opening Dashboard in browser...
start dashboard.html

echo.
echo ============================================================
echo   ALL SYSTEMS RUNNING!
echo.
echo   Dashboard  : dashboard.html (browser)
echo   API Docs   : http://localhost:8000/docs
echo   Live Data  : http://localhost:8000/api/live
echo   Health     : http://localhost:8000/api/health
echo.
echo   MQTT Broker: broker.hivemq.com:1883
echo   Topics     : powerplant/#
echo ============================================================
echo.
pause
