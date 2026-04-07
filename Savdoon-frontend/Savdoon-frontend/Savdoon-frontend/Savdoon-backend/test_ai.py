import os
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

key = os.getenv('GEMINI_API_KEY')
if not key:
    print("No key found")
    exit(1)

genai.configure(api_key=key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello, respond with 'OK'")
    print(f"Text check: {response.text.strip()}")
    
    # Test vision without real image first (this might fail but we see the error)
    # Actually let's just test if the model initializes
    print("Model initialized successfully")
except Exception as e:
    print(f"Error: {e}")
