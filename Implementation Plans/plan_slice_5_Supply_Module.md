# План реализации Среза №5: Модуль Снабжения и Материалов (Supply & Materials Module)

## Описание
Этот срез посвящен реализации Модуля 6 «Снабжение / Материалы» согласно `docs/business_logic.md`. 
Мы добавляем управление поставщиками, каталогом материалов компании и заявками на закупку (потребностями), связанными с конкретными заказами клиентов.

## Шаги реализации

### 1. Слой БД (`backend/models.py`)
- **Модель `Supplier` (Поставщик)**:
  - `id` (Integer, Primary Key).
  - `name` (String, название поставщика, NOT NULL).
  - `contact_person` (String, контактное лицо, nullable).
  - `phone` (String, nullable).
  - `email` (String, nullable).
  - `created_at` (DateTime, по умолчанию UTC).
- **Модель `Material` (Материал)**:
  - `id` (Integer, Primary Key).
  - `name` (String, наименование, NOT NULL).
  - `sku` (String, артикул, nullable).
  - `unit` (String, единица измерения, например: шт, м², м.п., литр, NOT NULL).
  - `price` (Float, ориентировочная базовая цена за единицу).
  - `created_at` (DateTime, по умолчанию UTC).
- **Перечисление статусов закупки `SupplyRequestStatus` (Enum)**:
  - `черновик` (draft)
  - `согласовано` (approved)
  - `заказано` (ordered)
  - `получено` (delivered)
  - `отменено` (cancelled)
- **Модель `SupplyRequest` (Заявка на закупку / Потребность)**:
  - `id` (Integer, Primary Key).
  - `order_id` (Integer, ForeignKey к `orders.id`, NOT NULL).
  - `material_id` (Integer, ForeignKey к `materials.id`, NOT NULL).
  - `quantity` (Float, количество, NOT NULL).
  - `actual_price` (Float, фактическая цена закупки за единицу).
  - `status` (Enum `SupplyRequestStatus`, по умолчанию `черновик`).
  - `delivery_date` (Date, ожидаемая дата поставки, nullable).
  - `created_at` (DateTime, по умолчанию UTC).
- **Связи (Relationships)**:
  - Связь `Order.supply_requests` и `SupplyRequest.order` (один заказ может иметь много заявок на закупку).
  - Связь `Material.supply_requests` и `SupplyRequest.material`.

### 2. Схемы API (`backend/schemas.py`)
- **Поставщики**: `SupplierCreate`, `SupplierResponse` (наследует `SupplierCreate`, добавляет `id`, `created_at`).
- **Материалы**: `MaterialCreate`, `MaterialResponse` (наследует `MaterialCreate`, добавляет `id`, `created_at`).
- **Заявки на закупку**:
  - `SupplyRequestBase`: базовые поля (`quantity`, `actual_price`, `status`, `delivery_date`).
  - `SupplyRequestCreate`: наследует `SupplyRequestBase`, добавляет `order_id`, `material_id`.
  - `SupplyRequestStatusUpdate`: поле `status` (`SupplyRequestStatus`), `delivery_date` (nullable Date).
  - `SupplyRequestResponse`: наследует `SupplyRequestBase`, добавляет `id`, `order_id`, `material_id`, `created_at`, а также вспомогательные строки: `material_name`, `order_product_type`, `client_name` для вывода в интерфейсе без дополнительных запросов.

### 3. Эндпоинты API (`backend/main.py`)
- **Поставщики**: `POST /api/suppliers`, `GET /api/suppliers`.
- **Материалы**: `POST /api/materials`, `GET /api/materials`.
- **Заявки на закупку**:
  - `POST /api/supply-requests`: Создание заявки. Проверка существования заказа и материала.
  - `GET /api/supply-requests`: Получение списка всех потребностей (с роль-гардом `DIRECTOR`).
  - `PATCH /api/supply-requests/{id}/status`: Смена статуса закупки и/или даты планируемой доставки.
  - `DELETE /api/supply-requests/{id}`: Удаление закупки (роль-гард `DIRECTOR`).

### 4. Сидирование (`backend/seed_supply.py`)
- Создание тестовых поставщиков:
  - «ВудМаркет» (древесина и слэбы).
  - «Фурнитура-Люкс» (комплектующие).
- Создание тестовых материалов:
  - «Слэб Карагача» (цена 45000 руб / куб.м., ед: шт).
  - «Дубовый щит 40мм» (цена 5200 руб / кв.м., ед: м²).
  - «Лак акриловый» (цена 850 руб / литр, ед: литр).
  - «Петли Blum» (цена 320 руб / шт, ед: шт).
- Создание заявок на закупку (потребностей), привязанных к ранее созданным заказам Среза №3 (кухня, лестница, стол).

### 5. Автотесты (`backend/test_slice5.py`)
- Python-тест на базе `urllib`, проверяющий:
  1. Создание поставщика (POST) и материала (POST).
  2. Создание заявки на закупку под тестовый заказ (POST).
  3. Проверку полей ответа (получение списка GET).
  4. Обновление статуса на «заказано» и «получено» (PATCH).
  5. Удаление тестовой заявки на закупку (DELETE).

### 6. Интерфейс (`frontend/index.html`)
- **HTML**:
  - Блок «Снабжение и Закупки» ниже таблицы Задач.
  - Форма быстрого добавления заявки: селектор заказа, селектор материала, поле количества, поле фактической цены, поле даты доставки.
  - Таблица закупок с колонками: Заказ / Клиент, Материал, Количество, Сумма закупки (Кол-во * Фактическая цена), Статус закупки, Срок доставки, Действия (удаление).
- **CSS**:
  - Цветовая палитра для статусов закупки (`черновик` - серый, `согласовано` - синий, `заказано` - желтый, `получено` - зеленый, `отменено` - красный).
- **JavaScript**:
  - `fetchSuppliers()`, `fetchMaterials()`, `fetchSupplyRequests()`.
  - `createSupplyRequest()`.
  - `updateSupplyStatus(id, newStatus, selectEl)`.
  - `deleteSupplyRequest(id, btn)`.
  - Заполнение выпадающих списков материалов и заказов при создании заявки.

## Ожидаемый результат
Интегрированный модуль снабжения, позволяющий привязывать расходы на материалы к конкретным заказам, отслеживать сроки поставок материалов и видеть общие затраты на закупку в интерфейсе.
