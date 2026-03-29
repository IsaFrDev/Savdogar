import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
env_path = os.path.join(BASE_DIR, '.env')
print(f"Checking .env at: {env_path}")
print(f"Exists: {os.path.exists(env_path)}")

load_dotenv(env_path)
key = os.getenv('GEMINI_API_KEY')
print(f"GEMINI_API_KEY: {key[:10] if key else 'None'}...")
