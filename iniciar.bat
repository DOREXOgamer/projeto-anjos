@echo off
title Projeto Anjos - Setup e Inicializacao
color 0b

echo ===================================================
echo     INICIALIZANDO PROJETO ANJOS...
echo ===================================================
echo.

echo [0/3] Verificando configuracoes (.env)...
if not exist "apps\api\.env" (
    if exist "apps\api\.env.example" (
        echo Criando .env na API...
        copy "apps\api\.env.example" "apps\api\.env" >nul
    )
)
if not exist "apps\web\.env" (
    if exist "apps\web\.env.example" (
        echo Criando .env na Web...
        copy "apps\web\.env.example" "apps\web\.env" >nul
    )
)

echo.
echo [1/3] Instalando dependencias do projeto...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Utilizando banco de dados MongoDB Atlas (nuvem)...

echo.
echo [3/3] Iniciando os servidores (web e api)...
echo O servidor de desenvolvimento executara no console.
echo.
call npm run dev

pause
