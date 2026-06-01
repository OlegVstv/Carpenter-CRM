# План реализации Среза №7: Миграция на Next.js и Tailwind CSS v3

## Описание
Данный срез посвящен замене монолитного статического файла `index.html` на современную структуру веб-приложения на базе фреймворка **Next.js (App Router)**, языка **TypeScript** и утилитного CSS-фреймворка **Tailwind CSS v3**. В рамках этого среза вся существующая бизнес-логика и интерфейсы Срезов 1–6 (Лиды, Клиенты, Заказы, Задачи, Снабжение, Финансы) будут перенесены в интерактивные и повторно используемые React-компоненты.

---

## Шаги реализации

### 1. Подготовка инфраструктуры (Установка Node.js)
Так как на системе пользователя не установлена Node.js, первым шагом выполняется развертывание среды:
*   Запуск команды автоматической установки LTS-версии Node.js через Windows Package Manager:
    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```
*   Перезапуск терминала разработки для обновления путей окружения `PATH`.
*   Проверка успешности установки командами `node -v` и `npm -v`.

---

### 2. Инициализация и настройка проекта Next.js
*   Резервное копирование старого фронтенда: переместить текущую директорию `frontend` в `frontend-old`.
*   Инициализация Next.js с помощью `npx`:
    ```powershell
    npx -y create-next-app@latest frontend --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*"
    ```
    *(Примечание: Мы принудительно отключаем дефолтный Tailwind при генерации, чтобы установить именно версию v3 и сопутствующие зависимости вручную)*.
*   Переход в директорию `frontend` и установка зависимостей Tailwind CSS v3:
    ```powershell
    npm install -D tailwindcss@3 postcss autoprefixer lucide-react
    ```
*   Инициализация конфигурационных файлов Tailwind:
    ```powershell
    npx tailwindcss init -p
    ```
*   Настройка проксирования запросов к бэкенду. Создать/обновить файл `frontend/next.config.js` (или `next.config.mjs`):
    ```javascript
    /** @type {import('next').NextConfig} */
    const nextConfig = {
      async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: 'http://localhost:8000/api/:path*',
          },
        ];
      },
    };
    module.exports = nextConfig;
    ```

---

### 3. Конфигурация стилей и дизайн-системы (Tailwind CSS v3)
*   **Настройка `frontend/tailwind.config.js`**:
    Определить пути для сканирования классов и задать кастомные цветовые схемы (HSL-переменные из дизайн-системы проекта):
    ```javascript
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
      ],
      theme: {
        extend: {
          colors: {
            brand: {
              dark: '#2c3e50',
              blue: '#3498db',
              green: '#2ecc71',
              red: '#e74c3c',
              purple: '#9b59b6',
            }
          },
        },
      },
      plugins: [],
    }
    ```
*   **Глобальные стили `frontend/src/app/globals.css`**:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    body {
      background-color: #f8fafc;
      color: #1e293b;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    ```

---

### 4. Типизация и Слой данных (API)
*   **Типы TypeScript (`frontend/src/types/index.ts`)**:
    Определить строгие интерфейсы в соответствии с Pydantic-схемами FastAPI:
    ```typescript
    export interface Lead {
      id: number;
      client_name: string;
      phone: string;
      source: string;
      status: string;
      created_at: string;
    }
    // Аналогично описать Client, Order, Task, Supplier, Material, SupplyRequest, Payment, FinancialSummary
    ```
*   **Сервис запросов API (`frontend/src/services/api.ts`)**:
    Реализовать обертку над стандартным `fetch`, обрабатывающую ошибки и автоматически подставляющую заголовки JSON:
    ```typescript
    const API_BASE = '/api';

    export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
    ```
    Описать функции `getLeads()`, `createLead()`, `deleteLead()`, `getClients()`, `convertLead()`, `getOrders()`, `updateOrderStatus()`, `getTasks()`, `updateTaskStatus()`, `getFinancialSummary()`, `createPayment()`, `deletePayment()` и т.д.

---

### 5. Базовый макет и Сайдбар навигации
*   **Компонент `Sidebar` (`frontend/src/components/Sidebar.tsx`)**:
    *   Создать левую панель навигации (меню) с помощью Tailwind CSS.
    *   Добавить иконки `lucide-react` (Dashboard/Finance, Leads, Clients, Orders, Tasks, Supply).
    *   Интегрировать получение роли из `/api/health` и выводить бэйдж роли (`DIRECTOR` / `UNKNOWN`) внизу сайдбара.
*   **Общий лейаут (`frontend/src/app/layout.tsx`)**:
    *   Подключить сайдбар.
    *   Задать основную область контента с адаптивным отступом слева (`ml-64`) и адаптивной сеткой.

---

### 6. Портирование бизнес-модулей в React-компоненты
Вместо длинной страницы переключение будет происходить по страницам (роутам Next.js):

1.  **Главный дашборд (`frontend/src/app/page.tsx`):**
    *   Вывод 5 финансовых карточек на Tailwind с градиентами, тенями и микро-анимацией наведения (`hover:-translate-y-1 hover:shadow-lg transition-all duration-300`).
    *   Таблицы быстрых предупреждений: список просроченных задач и заказов с критическим статусом.
2.  **Модуль Лидов (`/leads`):**
    *   Красивая таблица лидов.
    *   Форма создания лида выносится в аккуратное **модальное окно** (Modal) с валидацией.
3.  **Модуль Клиентов (`/clients`):**
    *   Таблица клиентов с источниками и связью с лидами.
    *   Модальное окно для конвертации Лида по его ID.
4.  **Модуль Заказов (`/orders`):**
    *   Список заказов. Поле статуса рендерится как выпадающий список (`select`), стилизованный под цветной бэйдж.
    *   Рядом рендерится **Календарь (Timeline)** в виде аккуратного вертикального списка событий, сгруппированных по дням (дедлайны задач, даты выезда снабжения, даты монтажей).
5.  **Снабжение и Закупки (`/supply`):**
    *   Интерфейс с вкладками (Tabs): «Заявки на закупку», «Каталог материалов», «Поставщики».
    *   Формы добавления материалов и поставщиков выносятся в модальные окна.
6.  **Финансовый модуль (`/finance`):**
    *   Таблица доходов клиентов (с кнопками «Внести платеж» и просмотром истории платежей во всплывающем списке).
    *   Таблица расходов по закупкам (с кнопкой быстрого согласования «Согласовать» для директора).

---

### 7. Обновление FastAPI бэкенда (`backend/main.py`)
*   Отключить старый эндпоинт отдачи статического `index.html` по корневому роуту `/api` (или `/`).
*   Добавить обработку исключений и логирование ошибок, если Next.js шлет некорректно сформированный JSON.

---

### 8. Ожидаемый результат
Современное, премиальное SPA-приложение на Next.js, стилизованное с помощью Tailwind CSS v3, с удобной модульной навигацией через сайдбар, интерактивными модальными окнами, типизированными запросами к бэкенду и полностью покрывающее логику предыдущих шести срезов.
