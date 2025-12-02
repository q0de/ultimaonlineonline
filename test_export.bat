@echo off
echo ========================================
echo Test Exported UO Frame
echo ========================================
echo.
echo Please copy your exported 400-X.bmp file to:
echo   assets\sprites\characters\test\400-X.bmp
echo.
echo Then press any key to continue...
pause >nul

python test_exported_frame.py

echo.
echo Done! Now refresh your browser to see the result.
pause

