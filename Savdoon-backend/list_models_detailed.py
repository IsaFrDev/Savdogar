import os
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=key)

try:
    print("Listing all models:")
    for m in genai.list_models():
        print(f"Name: {m.name}, Methods: {m.supported_generation_methods}")
except Exception as e:
    print(f"Error: {e}")
