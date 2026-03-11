@echo off
setlocal enabledelayedexpansion

:: --- CONFIGURAÇÃO ---
:: Caminho padrao do Docker Desktop no Windows
set "DOCKER_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"
:: URL do seu banco no Railway
set "DATABASE_URL=postgresql://postgres:yAOqurBCyplHuvAPJTUzDDcGQGjLXhdl@tramway.proxy.rlwy.net:45006/railway"
:: Onde os backups serao salvos no seu Windows
set "BACKUP_DIR=C:\Backups\ProjetoTaquaralto"

:: Pegar data segura via PowerShell (evita erro de idioma do Windows)
for /f "tokens=*" %%a in ('powershell -Command "Get-Date -Format 'yyyy-MM-dd'"') do set "DATA=%%a"
set "FILENAME=backup_%DATA%.sql"

echo ======================================================
echo   INICIANDO PROCESSO DE BACKUP (VERSAO ROBUSTA)
echo ======================================================

:: 1. Verificar se o Docker esta rodando
echo 1. Verificando se o Docker esta rodando...
docker info >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Docker ja esta rodando. Seguindo...
    goto :docker_pronto
)

echo Docker nao esta rodando. Tentando abrir o Docker Desktop...
if not exist "%DOCKER_PATH%" (
    echo.
    echo [ERRO] Nao encontrei o Docker Desktop em: "%DOCKER_PATH%"
    echo Verifique se o Docker esta instalado ou mude o caminho no script.
    pause
    exit /b
)

:: Abre o Docker Desktop e continua o script
start "" "%DOCKER_PATH%"

:aguardar_docker
echo Aguardando o Docker carregar (10 segundos)...
timeout /t 10 /nobreak >nul
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker ainda nao esta pronto...
    goto :aguardar_docker
)

:docker_pronto
echo.
echo Docker esta pronto! Preparando o backup...

:: 2. Criar pasta de backup se nao existir
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: 3. Rodar o Backup dentro do container
echo 2. Gerando arquivo de backup no container (Versao 17)...
docker rm -f backup_temp >nul 2>&1
docker run --name backup_temp postgres:17-alpine pg_dump "%DATABASE_URL%" -F c -b -v -f /tmp/backup.dump

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Falha ao gerar o backup no container. 
    echo Verifique sua conexao com a internet e se a DATABASE_URL esta correta.
    docker rm -f backup_temp >nul 2>&1
    pause
    exit /b
)

:: 4. Copiar o arquivo gerado para o Windows
echo 3. Copiando arquivo para o seu Windows em: "%BACKUP_DIR%"...
docker cp backup_temp:/tmp/backup.dump "%BACKUP_DIR%\%FILENAME%"

:: 5. Limpar o container temporario
echo 4. Limpando rastros...
docker rm -f backup_temp >nul 2>&1

echo.
echo ======================================================
echo   SUCESSO! BACKUP REALIZADO COM EXITO.
echo ======================================================
echo Local: %BACKUP_DIR%\%FILENAME%
echo.
echo Detalhes do arquivo:
dir "%BACKUP_DIR%\%FILENAME%" | findstr /i "%FILENAME%"

echo.
echo Pressione qualquer tecla para sair...
pause
