@echo off
echo [%date% %time%] TUNNEL START >> "%TEMP%\stm-app\tunnel.log"
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8080 --no-autoupdate >> "%TEMP%\stm-app\tunnel.log" 2>&1