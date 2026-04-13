import os
import sys
from pathlib import Path

# Add the Savdoon-backend/products directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / 'products'))

from ai_service import AIService

def test_ai():
    print("Initializing AIService...")
    service = AIService()
    
    if not service.clients:
        print("ERROR: No AI clients initialized. Check your .env file.")
        return

    print(f"Testing with {len(service.clients)} clients.")

    try:
        print("\n1. Testing generate_description...")
        desc = service.generate_description("Samsung Galaxy S24", "Smartphones", "uz")
        print(f"Result: {desc[:100]}...")
    except Exception as e:
        print(f"FAILED: {e}")

    try:
        print("\n2. Testing generate_ui_config (The one that failed)...")
        # Simulate a small UI config request
        config = service.generate_ui_config(
            user_prompt="Qora rangli zamonaviy dizayn yarat",
            business_type="Elektronika do'koni",
            current_config={"primary_color": "#000000"}
        )
        print(f"Result (AI Logic): {config.get('ai_logic_summary', 'No summary')}")
        print("SUCCESS: UI config generated without 400 error.")
    except Exception as e:
        print(f"FAILED: {e}")

    try:
        print("\n3. Testing chat...")
        response = service.chat("Telefonlar bormi?", "Sizda qanday telefonlar bor?", "iPhone 15, Samsung S23", {"name": "TestStore"}, "uz")
        print(f"Result: {response}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_ai()
