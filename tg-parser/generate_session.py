"""
Скрипт для генерации SESSION_STRING.
Запусти локально: python generate_session.py
Введи телефон и код — получишь строку сессии для env-переменной.
"""

from telethon.sync import TelegramClient
from telethon.sessions import StringSession

API_ID = int(input("Введи API_ID: "))
API_HASH = input("Введи API_HASH: ")

with TelegramClient(StringSession(), API_ID, API_HASH) as client:
    print("\n=== SESSION_STRING ===")
    print(client.session.save())
    print("======================")
    print("\nСкопируй строку выше и вставь в переменную SESSION_STRING на Railway.")
