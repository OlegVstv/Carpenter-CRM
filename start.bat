@echo off
echo ==============================================
echo Запуск инфраструктуры Carpenter CRM (Срез 0)
echo ==============================================

echo [1] Проверка и запуск базы данных PostgreSQL (Docker)...
docker-compose up -d

echo [2] Запуск Backend-сервера FastAPI...
echo Сервер будет доступен по адресу: http://127.0.0.1:8000
echo Для остановки нажмите Ctrl+C
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
