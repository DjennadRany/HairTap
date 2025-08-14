@echo off
echo ========================================
echo    TAPHAIR - DEMARRAGE AUTOMATIQUE
echo ========================================
echo.

echo 🔌 Demarrage du backend...
start "Backend TapHair" cmd /k "cd back && npm start"

echo ⏳ Attente de 5 secondes pour le backend...
timeout /t 5 /nobreak >nul

echo 🌐 Demarrage du frontend...
start "Frontend TapHair" cmd /k "cd front && npm run dev"

echo.
echo ✅ Serveurs demarres !
echo.
echo 📱 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo 📚 API Docs: http://localhost:5000/api-docs
echo.
echo 🔍 Pour tester la connexion MongoDB:
echo    cd back && node test-connection.js
echo.
pause 