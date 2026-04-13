@echo off
title Projeto Anjos - Setup e Inicializacao
color 0b

echo ===================================================
echo     INICIALIZANDO PROJETO ANJOS...
echo ===================================================
echo.

echo [0/5] Verificando configuracoes (.env)...
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
echo [1/5] Instalando dependencias do projeto...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] Tentando iniciar banco de dados (Docker)...
docker compose up -d 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Docker nao detectado. 
    echo Assumindo que o banco de dados PostgreSQL ja esta rodando nativamente ou em outro lugar.
) else (
    echo Banco de dados iniciado pelo Docker com sucesso!
)

echo.
echo Aguardando o banco de dados ficar pronto...
timeout /t 5 /nobreak >nul

echo.
echo [3/5] Gerando cliente Prisma...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao gerar Prisma Client.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/5] Executando migrations do banco de dados...
call npm run prisma:migrate
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao executar as migrations do banco.
    pause
    exit /b %errorlevel%
)

echo.
echo [5/5] Iniciando os servidores (web e api)...
echo O servidor de desenvolvimento executara no console.
echo.
call npm run dev

pause
