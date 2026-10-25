@echo off
title MeruVerse Localhost
cd /d "%~dp0"
start "MeruVerse Server" cmd /k "node server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://localhost:4173"
echo.
echo MeruVerse sedang dibuka di http://localhost:4173
echo Tutup tetingkap server untuk hentikan localhost.
