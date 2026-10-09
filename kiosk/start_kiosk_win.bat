@echo off
rem ============================================================
rem  СТЕНД «СТАДИОН ИМ. ЛЕНИНСКОГО КОМСОМОЛА» — запуск киоска
rem  Windows: двойной клик по этому файлу.
rem  Требуется Google Chrome или Microsoft Edge.
rem ============================================================

setlocal
cd /d "%~dp0"

rem --- 1. Локальный сервер (нужен для model.glb и шрифтов) ---
rem Если Python установлен — используем его; иначе откройте start_server.exe
start "StadionLK server" /min py -3 -m http.server 8377 --bind 127.0.0.1 2>nul || start "StadionLK server" /min python -m http.server 8377 --bind 127.0.0.1 2>nul

timeout /t 2 /nobreak >nul

rem --- 2. Браузер в режиме киоска ---
set URL=http://127.0.0.1:8377/stand.html

set CHROME="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist %CHROME% set CHROME="%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

%CHROME% --kiosk %URL% --autoplay-policy=no-user-gesture-required --disable-translate --no-first-run --disable-session-crashed-bubble --overscroll-history-navigation=0

rem --- 3. После закрытия браузера (Alt+F4) гасим сервер ---
taskkill /f /fi "WINDOWTITLE eq StadionLK server*" >nul 2>&1
endlocal
