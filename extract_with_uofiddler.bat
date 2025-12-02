@echo off
echo ========================================
echo UO Asset Extraction with UOFiddler
echo ========================================
echo.
echo Starting UOFiddler...
echo.
echo INSTRUCTIONS:
echo 1. When UOFiddler opens, go to Options ^> Settings
echo 2. Set "Ultima Online Directory" to:
echo    C:\Program Files (x86)\Electronic Arts\Ultima Online Classic
echo 3. Click "Reload"
echo 4. Follow the extraction steps below
echo.
pause

cd /d "C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8"
start UoFiddler.exe

echo.
echo ========================================
echo EXTRACTION STEPS:
echo ========================================
echo.
echo 1. ANIMATIONS TAB:
echo    - For Character: Body 400, Action 1 (Walk), Direction 0
echo    - Right-click ^> Export Animation ^> Save as:
echo      C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\male\idle.png
echo.
echo 2. ITEMS TAB:
echo    - Search for "5182" (Halberd)
echo    - Right-click ^> Export ^> Save as:
echo      C:\Users\micha\Projects\utlima-onmind\assets\sprites\weapons\halberd.png
echo.
echo 3. ANIMATIONS TAB (Spell Effects):
echo    - Search Animation ID: 14089 (Lightning)
echo    - Right-click ^> Export Animation ^> Save to:
echo      C:\Users\micha\Projects\utlima-onmind\assets\sprites\effects\lightning.png
echo.
echo    - Search Animation ID: 14239 (Energy Bolt)
echo    - Right-click ^> Export Animation ^> Save to:
echo      C:\Users\micha\Projects\utlima-onmind\assets\sprites\effects\ebolt.png
echo.
echo    - Search Animation ID: 14000 (Explosion)
echo    - Right-click ^> Export Animation ^> Save to:
echo      C:\Users\micha\Projects\utlima-onmind\assets\sprites\effects\explosion.png
echo.
echo 4. TEXTURES TAB (Ground tiles):
echo    - Find grass texture (try IDs 0-100)
echo    - Right-click ^> Export ^> Save to:
echo      C:\Users\micha\Projects\utlima-onmind\assets\tiles\grass.png
echo.
echo ========================================
echo When done, close UOFiddler and refresh your browser!
echo ========================================
pause

