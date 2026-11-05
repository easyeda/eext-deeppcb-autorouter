@echo off
setlocal
cd /d "%~dp0"
title DeepPCB Local Proxy
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-proxy.ps1"
echo.
pause
