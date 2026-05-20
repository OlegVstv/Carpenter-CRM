import sys

def test_imports_and_db():
    print("=== Carpenter CRM Infrastructure Test ===")
    print(f"Python executable: {sys.executable}")
    print(f"Python version: {sys.version.split(' ')[0]}")
    print("-" * 40)
    
    # 1. Проверка установки необходимых пакетов
    packages = {
        'fastapi': 'FastAPI (Web-фреймворк)',
        'sqlalchemy': 'SQLAlchemy (ORM)',
        'psycopg2': 'psycopg2 (Драйвер БД)',
        'dotenv': 'python-dotenv (Переменные окружения)'
    }
    
    missing_packages = []
    
    for pkg, desc in packages.items():
        try:
            __import__(pkg)
            print(f"[OK] Установлен: {desc}")
        except ImportError:
            print(f"[ERROR] НЕ установлен: {desc} (pip install {pkg})")
            missing_packages.append(pkg)
            
    print("-" * 40)
    
    # 2. Проверка подключения к базе данных
    if 'psycopg2' not in missing_packages:
        import psycopg2
        from psycopg2 import OperationalError
        
        # Строка подключения взята из docker-compose.yml
        DB_URL = "postgresql://admin:crm_password_2026@localhost:5432/carpenter_db"
        print(f"Проверка подключения к БД: {DB_URL}")
        
        try:
            conn = psycopg2.connect(DB_URL)
            print("[OK] УСПЕХ: База данных PostgreSQL доступна!")
            
            # Проверка расширения pgvector
            cur = conn.cursor()
            cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
            vector_ext = cur.fetchone()
            if vector_ext:
                 print("[OK] УСПЕХ: Расширение pgvector включено в БД!")
            else:
                 print("[WARN] ПРЕДУПРЕЖДЕНИЕ: Расширение pgvector не найдено. Возможно, требуется: CREATE EXTENSION vector;")
            
            conn.close()
        except OperationalError as e:
            print(f"[ERROR] ОШИБКА ПОДКЛЮЧЕНИЯ К БД.")
            print(f"   Убедитесь, что контейнер запущен (docker-compose up -d).")
            print(f"   Детали ошибки: {e}")
    else:
        print("[WARN] Пропуск теста базы данных: драйвер psycopg2 не установлен.")
        
    print("-" * 40)
    if missing_packages:
        print("[INFO] Рекомендация: Выполните команду для установки недостающих пакетов:")
        print(f"   powershell -c \".\\backend\\.venv\\Scripts\\python.exe -m pip install {' '.join(missing_packages)}\"")

if __name__ == "__main__":
    test_imports_and_db()
