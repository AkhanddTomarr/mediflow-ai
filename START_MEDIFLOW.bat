@echo off
title MediFlow AI
cd /d "%~dp0"

echo Starting MediFlow AI...
start "MediFlow AI Server" cmd /k "python backend\server.py"

timeout /t 3 /nobreak >nul

echo Opening MediFlow AI in Chrome...
start "" "http://localhost:8080"

echo.
echo MediFlow AI is running at http://localhost:8080
echo Keep the server window open while presenting.
