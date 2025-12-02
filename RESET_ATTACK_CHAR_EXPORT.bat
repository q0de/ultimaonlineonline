@echo off
echo ========================================
echo RESET Character Attack Animation Export
echo ========================================
echo.
echo This will:
echo 1. Delete the attack-bash-2h-char folder
echo 2. Reset the direction tracker
echo 3. Clean up any loose Mob 400-X.bmp files
echo.
echo Press Ctrl+C to cancel, or
pause

cd /d "%~dp0"

echo.
echo Deleting attack-bash-2h-char folder...
if exist "assets\sprites\animations\attack-bash-2h-char" (
    rmdir /s /q "assets\sprites\animations\attack-bash-2h-char"
    echo   ✓ Folder deleted
) else (
    echo   ✓ Folder doesn't exist (nothing to delete)
)

echo.
echo Resetting direction tracker...
if exist "assets\sprites\animations\.direction_tracker_attack_char.json" (
    del /q "assets\sprites\animations\.direction_tracker_attack_char.json"
    echo   ✓ Tracker reset
) else (
    echo   ✓ Tracker doesn't exist (nothing to reset)
)

echo.
echo Cleaning up loose Mob 400-X.bmp files...
if exist "assets\sprites\animations\Mob 400-*.bmp" (
    del /q "assets\sprites\animations\Mob 400-*.bmp"
    echo   ✓ Loose files deleted
) else (
    echo   ✓ No loose files found
)

echo.
echo ========================================
echo ✅ RESET COMPLETE!
echo ========================================
echo.
echo You can now start fresh:
echo 1. Run: START_AUTO_ORGANIZE_ATTACK_CHAR.bat
echo 2. Export the CORRECT animation from UOFiddler
echo.
pause



