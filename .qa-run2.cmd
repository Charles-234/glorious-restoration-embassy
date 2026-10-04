@echo off
REM Second pass: keep the warm .next cache from the previous run so routes do not
REM each pay a cold compile again. Only make sure port 3000 is free so Playwright
REM is the single owner of the dev server for this run.
cd /d "d:\Glorious Restoration Embassy"
echo start %date% %time%> .qa2-marker.txt

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo killing %%a>> .qa2-marker.txt
  taskkill /F /PID %%a >> .qa2-marker.txt 2>&1
)
timeout /t 4 /nobreak >nul
echo test-start %date% %time%>> .qa2-marker.txt

call npx playwright test > .test-out2.txt 2>&1
echo TEST_EXIT=%errorlevel% >> .qa2-marker.txt
echo test-done %date% %time%>> .qa2-marker.txt

REM Hand the dev server back to the user.
echo restarted-at %date% %time%> .devserver.log
call npm run dev >> .devserver.log 2>&1