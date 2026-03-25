"""
Telegram-парсер лидов по ключевым словам.
Telethon (SearchGlobalRequest) + httpx (Bot API).
"""

import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path

import httpx
from telethon import TelegramClient, errors
from telethon.sessions import StringSession
from telethon.tl.functions.messages import SearchGlobalRequest
from telethon.tl.types import InputMessagesFilterEmpty, InputPeerEmpty

from config import (
    API_HASH,
    API_ID,
    BOT_TOKEN,
    DATA_DIR,
    MY_CHAT_ID,
    SEARCH_INTERVAL,
    SESSION_STRING,
)
from keywords import KEYWORDS

# ── Логирование ──────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("parser")

# ── Часовой пояс Новосибирск (UTC+7) ────────────────────────

TZ_NSK = timezone(timedelta(hours=7))

# ── Пути к файлам данных ─────────────────────────────────────

SEEN_IDS_PATH = Path(DATA_DIR) / "seen_ids.json"
MAX_SEEN = 10_000

# ── Дедупликация ─────────────────────────────────────────────


def load_seen() -> set[str]:
    if SEEN_IDS_PATH.exists():
        try:
            data = json.loads(SEEN_IDS_PATH.read_text())
            return set(data)
        except (json.JSONDecodeError, TypeError):
            log.warning("seen_ids.json повреждён, начинаю с пустого набора")
    return set()


def save_seen(seen: set[str]) -> None:
    items = list(seen)
    if len(items) > MAX_SEEN:
        items = items[-MAX_SEEN:]
    SEEN_IDS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SEEN_IDS_PATH.write_text(json.dumps(items, ensure_ascii=False))


# ── Отправка сообщения через Bot API ────────────────────────


async def send_lead(http: httpx.AsyncClient, text: str) -> None:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": MY_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    for attempt in range(3):
        try:
            resp = await http.post(url, json=payload, timeout=15)
            data = resp.json()
            if data.get("ok"):
                return
            # Если Telegram вернул retry_after — ждём
            retry_after = data.get("parameters", {}).get("retry_after")
            if retry_after:
                log.warning("Bot API rate limit, жду %s сек", retry_after)
                await asyncio.sleep(int(retry_after) + 1)
                continue
            log.error("Bot API ошибка: %s", data)
            return
        except httpx.HTTPError as e:
            log.error("HTTP ошибка при отправке: %s", e)
            if attempt < 2:
                await asyncio.sleep(3)


async def send_startup_message(http: httpx.AsyncClient) -> None:
    text = f"\U0001f916 Парсер запущен, слежу за {len(KEYWORDS)} ключевыми словами"
    await send_lead(http, text)


# ── Формирование карточки лида ───────────────────────────────


def format_lead(keyword: str, msg, chat_title: str, chat_username: str | None) -> str:
    # Автор
    sender = msg.sender
    if sender and getattr(sender, "username", None):
        author = f"@{sender.username}"
    elif sender:
        first = getattr(sender, "first_name", "") or ""
        last = getattr(sender, "last_name", "") or ""
        author = escape(f"{first} {last}".strip()) or "Неизвестный"
    else:
        author = "Неизвестный"

    # Ссылка на пост
    if chat_username:
        link = f"https://t.me/{chat_username}/{msg.id}"
        link_line = f'\U0001f517 <a href="{link}">{link}</a>'
    else:
        link_line = "\U0001f517 Приватный чат — ссылка недоступна"

    # Дата в UTC+7
    dt = msg.date.astimezone(TZ_NSK)
    date_str = dt.strftime("%d.%m.%Y %H:%M")

    # Текст поста
    text = (msg.message or "").strip()
    if len(text) > 400:
        text = text[:400] + "\u2026"
    text = escape(text)

    safe_title = escape(chat_title)

    return (
        f"\U0001f50d <b>{escape(keyword)}</b>\n\n"
        f"\U0001f464 {author}\n"
        f"\U0001f4cd Группа: {safe_title}\n"
        f"{link_line}\n"
        f"\U0001f550 {date_str}\n\n"
        f'\U0001f4ac "{text}"'
    )


# ── Получение информации о чате ──────────────────────────────


async def get_chat_info(client: TelegramClient, peer) -> tuple[str, str | None]:
    """Возвращает (title, username|None)."""
    try:
        entity = await client.get_entity(peer)
        title = getattr(entity, "title", None) or "Неизвестный чат"
        username = getattr(entity, "username", None)
        return title, username
    except Exception as e:
        log.warning("Не удалось получить инфо о чате: %s", e)
        return "Неизвестный чат", None


# ── Поиск по одному ключевому слову ─────────────────────────


async def search_keyword(
    client: TelegramClient,
    http: httpx.AsyncClient,
    keyword: str,
    seen: set[str],
) -> int:
    """Возвращает количество новых лидов."""
    new_count = 0
    try:
        result = await client(
            SearchGlobalRequest(
                q=keyword,
                filter=InputMessagesFilterEmpty(),
                min_date=None,
                max_date=None,
                offset_rate=0,
                offset_peer=InputPeerEmpty(),
                offset_id=0,
                limit=50,
            )
        )
    except errors.FloodWaitError as e:
        log.warning("FloodWait %s сек на поиск '%s'", e.seconds, keyword)
        await asyncio.sleep(e.seconds + 5)
        return 0
    except Exception as e:
        log.error("Ошибка поиска '%s': %s", keyword, e)
        return 0

    for msg in result.messages:
        # Пропускаем медиа без текста
        if not msg.message:
            continue

        uid = f"{msg.peer_id.channel_id if hasattr(msg.peer_id, 'channel_id') else msg.peer_id.chat_id if hasattr(msg.peer_id, 'chat_id') else msg.peer_id.user_id}_{msg.id}"

        if uid in seen:
            continue

        seen.add(uid)
        chat_title, chat_username = await get_chat_info(client, msg.peer_id)
        card = format_lead(keyword, msg, chat_title, chat_username)
        await send_lead(http, card)
        new_count += 1
        await asyncio.sleep(1.5)

    return new_count


# ── Основной цикл ───────────────────────────────────────────


async def main() -> None:
    log.info("Запуск парсера...")

    client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
    await client.start()
    log.info("Telethon подключен")

    seen = load_seen()
    log.info("Загружено %d seen_ids", len(seen))

    async with httpx.AsyncClient() as http:
        await send_startup_message(http)

        while True:
            total_new = 0
            total_checked = 0

            for keyword in KEYWORDS:
                new = await search_keyword(client, http, keyword, seen)
                total_new += new
                total_checked += 1
                # Пауза между поисками — flood control
                await asyncio.sleep(4)

            save_seen(seen)
            log.info(
                "Проход завершён: проверено %d ключевых слов, найдено %d новых лидов. "
                "Следующий через %d сек.",
                total_checked,
                total_new,
                SEARCH_INTERVAL,
            )
            await asyncio.sleep(SEARCH_INTERVAL)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Остановлен вручную")
