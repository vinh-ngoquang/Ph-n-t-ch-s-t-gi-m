@echo off
title VnExpress Analytics Dashboard
echo ========================================================
echo   KHOI CHAY DASHBOARD PHAN TICH SUT GIAM VNEXPRESS
echo ========================================================
echo.

:: Them Node vao PATH neu chua co
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo [1/2] Dang khoi dong Web Server Local...
start "" http://localhost:3000

echo [2/2] Dang chay Vite Dev Server tren cong 3000...
npm run dev

pause
