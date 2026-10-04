@echo off
REM Deterministic e2e run: ensure exactly ONE dev server owns .next, then let
REM Playwright manage it for the whole run, then hand the dev server back.
cd /d "d:\Glorious Restoration Embassy"
echo start %date% %time%> .qa-marker.txt

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo killing %%a>> .qa-marker.txt
  taskkill /F /PID %%a >> .qa-marker.txt 2>&1
)
timeout /t 4 /nobreak >nul

if exist .next (
  echo removing .next>> .qa-marker.txt
  rmdir /s /q .next
)
echo clean>> .qa-marker.txt

echo test-start %date% %time%>> .qa-marker.txt
call npx playwright test > .test-out.txt 2>&1
echo TEST_EXIT=%errorlevel%>> .qa-marker.txt
echo test-done %date% %time%>> .qa-marker.txt

REM Give the user their dev server back afterwards.
if exist .next rmdir /s /q .next
echo restarted-at %date% %time%> .devserver.log
call npm run dev >> .devserver.log 2>&1