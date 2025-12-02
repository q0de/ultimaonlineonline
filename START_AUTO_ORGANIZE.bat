@echo off
echo Installing watchdog (file monitoring library)...
pip install watchdog
echo.
echo Starting auto-organizer...
echo.
python auto_organize.py
pause

