@echo off
chcp 65001 >nul
title Portal Biblioteca Meira Delmar
cd /d "%~dp0sitio"

rem Busca PHP: primero el instalado con winget; si no, el que esté en el PATH
set "PHPEXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
if not exist "%PHPEXE%" (
  set "PHPEXE="
  for /f "delims=" %%p in ('where php 2^>nul') do if not defined PHPEXE set "PHPEXE=%%p"
)
if not defined PHPEXE (
  echo No se encontro PHP. Instalalo con:  winget install PHP.PHP.8.3
  pause
  exit /b 1
)
for %%i in ("%PHPEXE%") do set "PHPDIR=%%~dpi"

echo.
echo   Portal Biblioteca Meira Delmar
echo   Abre en el navegador:  http://localhost:8080
echo   Para apagar la pagina, cierra esta ventana o presiona Ctrl + C
echo.

start "" http://localhost:8080
"%PHPEXE%" -n -d extension_dir="%PHPDIR%ext" -d extension=openssl -d extension=mbstring -d display_errors=0 -d log_errors=1 -S localhost:8080
