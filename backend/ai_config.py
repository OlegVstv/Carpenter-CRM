# ai_config.py - Адаптированная версия под Windows Infrastructure
import os
import vertexai
from vertexai.generative_models import GenerativeModel

# 1. Инициализация согласно тех. стандарту (Часть 2, п. 5)
# В 2026 году ключи берем из .env.local через переменные окружения
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "wood-crm-2026")
LOCATION = "us-central1"

vertexai.init(project=PROJECT_ID, location=LOCATION)

# 2. Системные инструкции согласно ТЗ (Модуль 3: Производство)
# Мы фиксируем роль, чтобы ИИ не галлюцинировал (Тех. стандарт п. 4)
SYSTEM_INSTRUCTION = (
    "Ты — эксперт-технолог столярного производства. Твои ответы должны базироваться "
    "только на загруженных регламентах. Если информации нет в базе — предложи позвать Начальника цеха."
)

# 3. Базовый AI-поток (Flow) в архитектуре 2026
def carpenter_assistant_flow(query: str) -> str:
    """
    Обработка запросов цеха через Gemini 1.5 Pro
    """
    model = GenerativeModel(
        "gemini-1.5-pro",
        system_instruction=[SYSTEM_INSTRUCTION] # Промпт-инжиниринг в коде
    )
    
    response = model.generate_content(query)
    return response.text

# Бизнес-валидация: На Срезе №5 этот поток будет подключен к pgvector
