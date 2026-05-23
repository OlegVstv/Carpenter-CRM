
# Implementation Plan: Slice #1 (Leads Module) - Version 1.1

## 1. Описание цели (Goal Description)
Реализация первого вертикального среза CRM-системы Carpenter-CRM: модуль входящих заявок (Лидов). Срез включает в себя проектирование схемы БД с жесткой валидацией через Enum, создание Pydantic-схем, разработку двух API-эндпоинтов (создание и получение списка лидов для экрана Директора) и скрипта сидирования тестовых данных столярного цеха.

Все технические решения принимаются строго на основе регламента `docs/infra_standard.md` и бизнес-требований продукта.

## 2. Предлагаемые изменения (Proposed Changes)

### 2.1. Слой базы данных (Database & ORM Layer)

#### [NEW] Перечисления (Enums) в `backend/models.py` (или отдельном `backend/enums.py`)
Для обеспечения строгой типизации и исключения "мусорных" данных в БД, создать Python-перечисления:

```python
import enum

class LeadSource(str, enum.Enum):
    CALL = "звонок"
    WHATSAPP = "WhatsApp"
    INSTAGRAM = "Instagram"
    WEBSITE = "сайт"
    RECOMMENDATION = "рекомендация"
    REPEAT_CLIENT = "повторный клиент"
    ADVERTISING = "реклама"
    MANUAL = "вручную внесено"

class LeadStatus(str, enum.Enum):
    NEW = "новый запрос"
    CALCULATION = "просчет / КП"
    SENT = "КП отправлено"
    AGREEMENT = "согласование"
    REJECTION = "отказ"

```

#### [NEW] Модель SQLAlchemy `Lead` в `backend/models.py`

Создать модель `Lead`, наследуемую от `Base` из `database.py`:

* `id`: Integer, Primary Key, autoincrement.
* `client_name`: String, nullable=False (ФИО клиента).
* `phone`: String, nullable=False (Телефон).
* `source`: Enum(LeadSource), nullable=False (Источник заявки из ТЗ).
* `status`: Enum(LeadStatus), nullable=False, default=LeadStatus.NEW (Статус обработки из ТЗ).
* `created_at`: DateTime, default=datetime.utcnow (Дата создания).

### 2.2. Слой валидации API (Pydantic Schemas)

#### [NEW] `backend/schemas.py`

Создать схемы для валидации входящих и исходящих данных, использующие созданные Enum:

```python
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from .models import LeadSource, LeadStatus

class LeadBase(BaseModel):
    client_name: str
    phone: str
    source: LeadSource
    status: LeadStatus = LeadStatus.NEW

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

```

### 2.3. Слой API Эндпоинтов (FastAPI Routing)

#### [MODIFY] `backend/main.py`

* Добавить автоматическое создание таблиц при старте приложения через lifespan (рекомендуется) или перед инициализацией `app`:
```python
models.Base.metadata.create_all(bind=engine)

```

* **Эндпоинт POST `/api/leads**`:
* Принимает payload `LeadCreate`.
* Создает объект модели `Lead`, сохраняет сессию в БД через `db.commit()` и `db.refresh()`.
* Возвращает созданный лид по схеме `LeadResponse`.


* **Эндпоинт GET `/api/leads**`:
* Реализует проверку заглушки роли: если `CURRENT_ROLE` (из конфигурации или окружения) не равен `"DIRECTOR"`, возвращает `HTTPException(status_code=403, detail="Forbidden")`.
* Извлекает все записи из таблицы `leads` (`db.query(models.Lead).all()`).
* Возвращает список лидов по схеме `List[LeadResponse]`.


### 2.4. Скрипт наполнения тестовыми данными (Seed Data Layer)

#### [NEW] `backend/seed.py`

Создать изолированный скрипт для наполнения базы данных 4 реалистичными кейсами столярного цеха:

```python
from database import SessionLocal
from models import Lead, LeadSource, LeadStatus

def seed_leads():
    db = SessionLocal()
    try:
        # Удаляем старые данные (опционально, для чистоты сидирования)
        db.query(Lead).delete()
        
        test_leads = [
            Lead(client_name="Иван Петров", phone="+7 (999) 111-22-33", source=LeadSource.WEBSITE, status=LeadStatus.NEW),
            Lead(client_name="Анна Смирнова", phone="+7 (999) 444-55-66", source=LeadSource.CALL, status=LeadStatus.CALCULATION),
            Lead(client_name="ИП Сидоров", phone="+7 (999) 777-88-99", source=LeadSource.WHATSAPP, status=LeadStatus.SENT),
            Lead(client_name="Михаил (Повторно)", phone="+7 (999) 000-11-22", source=LeadSource.REPEAT_CLIENT, status=LeadStatus.AGREEMENT)
        ]
        db.add_all(test_leads)
        db.commit()
        print("База данных успешно наполнена тестовыми лидами!")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при сидировании: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_leads()

```


## 3. План верификации (Verification Plan)

### 3.1. Наполнение БД (Сидирование)

Запустить скрипт наполнения данными строго из корневой директории через PowerShell:

```powershell
powershell -c ".\.venv\Scripts\python.exe backend/seed.py"

```

*Критерий успеха:* В консоли выведено сообщение об успешном наполнении, в Docker-контейнере в таблице `leads` появилось 4 строки.

### 3.2. Проверка через Swagger UI

1. Запустить сервер разработки:
```powershell
powershell -c ".\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload"

```

2. Открыть браузер на странице `http://localhost:8000/docs`.
3. Выполнить `GET /api/leads`: проверить получение массива из 4 объектов со статусами и источниками, соответствующими ТЗ.
4. Выполнить `POST /api/leads`: отправить тестовый JSON, убедиться, что некорректные значения `source` или `status` вызывают ошибку валидации `422 Unprocessable Entity`, а валидные данные успешно сохраняются.

```

```