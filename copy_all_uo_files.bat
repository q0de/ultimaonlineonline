@echo off
echo ========================================
echo Copying all UO files to assets\mul...
echo ========================================

cd /d "C:\Users\micha\Projects\utlima-onmind"

echo.
echo Copying texmapsLegacyMUL.uop...
copy "Ultima Online Classic\texmapsLegacyMUL.uop" "assets\mul\" /Y

echo.
echo Checking what files we have...
dir "assets\mul\"

echo.
echo ========================================
echo Done! Press any key to close.
echo ========================================
pause



