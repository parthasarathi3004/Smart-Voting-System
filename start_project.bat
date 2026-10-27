@echo off
echo ===================================================
echo Starting Biometric E-Voting Platform...
echo ===================================================
start cmd /k "node server/server.js"
start cmd /k "npm --prefix client run dev"
echo Both servers started successfully!

