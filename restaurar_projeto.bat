@echo off
setlocal

:: --- URL COMPLETA DO NOVO BANCO (Copie a URL publica do novo servidor) ---
set "DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@HOST_DO_RAILWAY_OU_SUPABASE:PORTA/NOME_DO_BANCO"

:: --- CONFIGURAÇÃO DO ARQUIVO DE BACKUP ---
:: Escolha o nome do arquivo que voce quer restaurar (dentro da pasta C:\Backups\ProjetoTaquaralto)
set BACKUP_DIR=C:\Backups\ProjetoTaquaralto
set FILENAME=backup_2026-03-11.sql

echo.
echo ======================================================
echo   AVISO: ISSO IRA APAGAR OS DADOS ATUAIS DO BANCO!
echo ======================================================
echo.
echo Arquivo selecionado: %BACKUP_DIR%\%FILENAME%
echo.
pause

:: 1. Limpar container antigo se existir
docker rm -f restore_temp >nul 2>&1

echo.
echo 1. Criando container temporario (Versao 17)...
docker create --name restore_temp postgres:17-alpine sleep 60

echo.
echo 2. Copiando arquivo do seu Windows para dentro do container...
docker cp "%BACKUP_DIR%\%FILENAME%" restore_temp:/tmp/backup.dump

echo.
echo 3. Iniciando restauracao para o servidor remoto...
:: Iniciamos o container e rodamos o pg_restore
docker start restore_temp
docker exec restore_temp pg_restore -d "%DATABASE_URL%" -v --no-owner --no-privileges --clean /tmp/backup.dump

echo.
echo 4. Limpando container temporario...
docker rm -f restore_temp >nul 2>&1

echo.
echo --- RESTAURACAO CONCLUIDA ---
echo Verifique os logs acima para garantir que nao houve erros graves.
pause
