@echo off
cd /d "C:\Users\Administrator\Documents\Default Project\backend"
set "PATH=C:\Program Files\nodejs;%PATH%"
npm run dev >> "%TEMP%\stm-app\backend.log" 2>&1