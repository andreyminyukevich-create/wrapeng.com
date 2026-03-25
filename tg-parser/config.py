import os

API_ID = int(os.environ["API_ID"])
API_HASH = os.environ["API_HASH"]
BOT_TOKEN = os.environ["BOT_TOKEN"]
MY_CHAT_ID = int(os.environ["MY_CHAT_ID"])
SESSION_STRING = os.environ["SESSION_STRING"]
SEARCH_INTERVAL = int(os.environ.get("SEARCH_INTERVAL", "1800"))
DATA_DIR = os.environ.get("DATA_DIR", "/data")
