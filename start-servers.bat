@echo off
echo 🚀 Démarrage des serveurs TapHair...

echo.
echo 📦 Démarrage du serveur backend...
cd back
start "Backend Server" cmd /k "npm run dev"

echo.
echo 🌐 Démarrage du serveur frontend...
cd ../front
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Serveurs démarrés !
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:5000
echo.
echo Appuyez sur une touche pour fermer...
pause 