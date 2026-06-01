# Описание архитектуры Carpenter CRM

В данном документе приведено описание общей архитектуры системы, архитектурная схема взаимодействия компонентов, ER-диаграмма базы данных и первоисточники архитектурных решений проекта.

---

## 1. Общее описание архитектуры проекта

Carpenter CRM спроектирована как локальная монолитная веб-система с разделением на независимый API-бэкенд и статический фронтенд. Система разрабатывается по методологии **Vertical Slices (Вертикальные срезы)**: каждая фича (срез) внедряется сквозным образом — от таблицы в базе данных и эндпоинтов до интерфейсного представления.

### Ключевые компоненты:
1.  **Frontend Layer (Клиентская часть):**
    *   Представлена в виде статического HTML/JS/CSS приложения в одном файле [index.html](file:///c:/My-Code-Factory/Antigravity/Carpenter-CRM/frontend/index.html).
    *   Общается с бэкендом по протоколу HTTP REST с использованием JSON.
    *   Не содержит сборщиков пакетов (Vite, Webpack), что минимизирует накладные расходы на инфраструктуру на этапе MVP.
2.  **Backend Layer (Серверная часть):**
    *   Реализована на Python с использованием фреймворка **FastAPI**.
    *   Запускается через ASGI-сервер **Uvicorn**.
    *   Обеспечивает валидацию входящих и исходящих данных с помощью моделей **Pydantic** (в [schemas.py](file:///c:/My-Code-Factory/Antigravity/Carpenter-CRM/backend/schemas.py)).
    *   Использует **SQLAlchemy ORM** для работы с данными в объектно-ориентированном стиле.
3.  **Database Layer (Слой данных):**
    *   **PostgreSQL** — реляционная СУБД, запущенная локально в Docker-контейнере.
    *   **pgvector** — расширение PostgreSQL для работы с векторными эмбеддингами. Оно предустановлено в Docker-образе (`ankane/pgvector`) и предназначено для последующей интеграции AI-агентов и семантического поиска (RAG-архитектура).

---

## 2. Диаграмма архитектурного решения (Mermaid)

Ниже представлена схема взаимодействия компонентов приложения:

```mermaid
graph TD
    Client[Браузер клиента / HTML+JS+CSS UI]
    FastAPI[FastAPI Backend в .venv]
    DB[(PostgreSQL + pgvector)]
    Docker[Docker-контейнер carpenter_crm_db]
    
    Client <-->|HTTP REST / JSON| FastAPI
    FastAPI <-->|SQLAlchemy ORM / SQL| DB
    
    subgraph Docker Compose Environment
        Docker -.-> DB
    end
    
    subgraph Local Server Environment
        Client
        FastAPI
    end
```

---

## 3. ER-диаграмма базы данных (Entity-Relationship)

> [!NOTE]
> Вы абсолютно верно указали название. **ER-диаграмма** (Entity-Relationship diagram, или диаграмма «сущность-связь») — это общепринятый стандарт в программной инженерии для визуализации структуры базы данных, таблиц, их атрибутов и связей между ними.

Ниже представлена актуальная ER-диаграмма базы данных Carpenter CRM на момент реализации Среза №6:

```mermaid
erDiagram
    LEADS {
        int id PK
        string client_name "Имя лида"
        string phone "Телефон"
        LeadSource source "Источник"
        LeadStatus status "Статус"
        datetime created_at "Создан"
    }
    CLIENTS {
        int id PK
        string name "Имя клиента"
        string phone "Телефон"
        string email "Email (nullable)"
        string address "Адрес (nullable)"
        LeadSource source "Источник"
        ClientStatus status "Статус"
        string comment "Комментарий (nullable)"
        int lead_id FK "Ссылка на лид (nullable, unique)"
        datetime created_at "Создан"
    }
    ORDERS {
        int id PK
        int client_id FK "Ссылка на клиента"
        string product_type "Тип изделия"
        string technical_spec "ТЗ (nullable)"
        float price "Стоимость"
        float paid_amount "Оплачено"
        OrderStatus status "Статус заказа"
        date delivery_date "Срок доставки (nullable)"
        date installation_date "Срок монтажа (nullable)"
        datetime created_at "Создан"
    }
    TASKS {
        int id PK
        string title "Название задачи"
        string description "Описание (nullable)"
        date due_date "Дедлайн (nullable)"
        TaskPriority priority "Приоритет"
        TaskStatus status "Статус задачи"
        string assigned_to "Исполнитель (role stub)"
        int order_id FK "Ссылка на заказ (nullable)"
        datetime created_at "Создан"
    }
    SUPPLIERS {
        int id PK
        string name "Название поставщика"
        string contact_person "Контактное лицо (nullable)"
        string phone "Телефон (nullable)"
        string email "Email (nullable)"
        datetime created_at "Создан"
    }
    MATERIALS {
        int id PK
        string name "Наименование материала"
        string sku "Артикул / SKU (nullable)"
        string unit "Единица измерения"
        float price "Базовая цена"
        datetime created_at "Создан"
    }
    SUPPLY_REQUESTS {
        int id PK
        int order_id FK "Ссылка на заказ"
        int material_id FK "Ссылка на материал"
        float quantity "Количество"
        float actual_price "Фактическая цена"
        SupplyRequestStatus status "Статус закупки"
        date delivery_date "Срок доставки (nullable)"
        datetime created_at "Создан"
    }
    PAYMENTS {
        int id PK
        int order_id FK "Ссылка на заказ"
        float amount "Сумма платежа"
        date payment_date "Дата оплаты"
        string comment "Комментарий (nullable)"
        datetime created_at "Создан"
    }

    LEADS ||--o| CLIENTS : "конвертируется в"
    CLIENTS ||--o{ ORDERS : "размещает"
    ORDERS ||--o{ TASKS : "содержит"
    ORDERS ||--o{ SUPPLY_REQUESTS : "требует материалы"
    ORDERS ||--o{ PAYMENTS : "получает оплаты"
    MATERIALS ||--o{ SUPPLY_REQUESTS : "указывается в"
```

---

## 4. Первоисточники архитектурных решений

Для понимания того, почему система спроектирована именно так, выделим ключевые концептуальные первоисточники:

1.  **Концепция Вертикальных Срезов (Vertical Slices):**
    *   *Суть:* Вместо построения горизонтальных слоев приложения (сначала вся база данных, затем все контроллеры, затем весь UI) система собирается функциональными блоками (срезами). Например, срез оплат содержит одну таблицу, 3 эндпоинта и одну форму.
    *   *Источник:* Описан в регламенте [infra_standard.md](file:///c:/My-Code-Factory/Antigravity/Carpenter-CRM/docs/infra_standard.md) (Часть 4). Позволяет быстро тестировать рабочие куски системы без оверинжиниринга.
2.  **Спецификация Бизнес-Логики (`docs/business_logic.md`):**
    *   *Суть:* Главный документ требований, описывающий 10 основных модулей CRM (каталог, лиды, заказы, задачи, снабжение, финансы и т.д.).
    *   *Источник:* [business_logic.md](file:///c:/My-Code-Factory/Antigravity/Carpenter-CRM/docs/business_logic.md). Отражает реальные процессы столярного производства компании, гибридный характер бизнеса (серийное производство + индивидуальные проекты) и требования к AI-ready архитектуре.
3.  **Архитектурный шаблон REST API (FastAPI + Pydantic):**
    *   *Суть:* Бэкенд является чистым stateless-сервисом, который общается с клиентом посредством JSON. Валидация строго отделена от моделей базы данных (Pydantic схемы vs SQLAlchemy ORM модели).
    *   *Источник:* Документация FastAPI и лучшие практики разработки REST-сервисов на Python.
4.  **AI-Ready Layer (pgvector + Vertex AI):**
    *   *Суть:* Векторное расширение в СУБД для хранения эмбеддингов документов и базы знаний. Архитектурное решение закладывает базу для локального RAG (Retrieval-Augmented Generation) без необходимости перестраивать хранилище данных при внедрении AI-агентов.
    *   *Источник:* Раздел "AI-Ready Layer" в [infra_standard.md](file:///c:/My-Code-Factory/Antigravity/Carpenter-CRM/docs/infra_standard.md) (Часть 2).
