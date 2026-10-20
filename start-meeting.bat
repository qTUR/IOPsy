@echo off
chcp 65001 >nul
cd /d "%~dp0"
title IOPsy
echo.
echo   تشغيل IOPsy ... (أغلق هذه النافذة لإيقاف الاجتماع)
echo.
call npm run meeting
pause
