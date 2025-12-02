@echo off
REM Auto-organize Equipment BMP files for Run Halberd animation

echo ========================================
echo   AUTO-ORGANIZE RUN HALBERD FRAMES
echo ========================================
echo.
echo This will organize Equipment BMP files into:
echo exports/running-halberd/[direction]/
echo.

python organize_manual_exports.py

pause

