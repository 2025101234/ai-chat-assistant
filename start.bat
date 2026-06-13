@echo off
echo Starting AI Chat Assistant...
echo.

:: Start Vite dev server in background
echo Starting Vite dev server...
start "Vite Dev Server" cmd /k "cd /d F:\ai\ai-chat-assistant && npm run dev"

:: Wait for Vite to be ready
echo Waiting for Vite to start...
timeout /t 8 /nobreak > nul

:: Start Electron with renderer URL
echo Starting Electron...
start "Electron App" cmd /k "cd /d F:\ai\ai-chat-assistant && set ELECTRON_RENDERER_URL=http://localhost:5173 && npx electron ."

echo.
echo Both windows are starting...
echo - Vite Dev Server: http://localhost:5173
echo - Electron App: Will open automatically
echo.
pause
