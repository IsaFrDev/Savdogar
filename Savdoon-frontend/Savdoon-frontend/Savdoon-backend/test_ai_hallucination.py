
import os
import django
import sys
from pathlib import Path

# Setup Django environment
sys.path.append(str(Path(__file__).resolve().parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from products.ai_concierge import AIConcierge

def test_hallucination_prevention():
    # Test case: Empty catalog
    store_id = 999  # Non-existent store ID will result in empty catalog
    user_message = "Menga kiyimlar ko'rsat" # Show me some clothes
    
    print(f"Testing with empty catalog...")
    response = AIConcierge.chat(store_id, user_message, store_name="Test Store")
    
    print("\nAI Response:")
    print(f"Reply: {response['reply']}")
    print(f"Products: {response['products']}")
    
    if "kiyov" in response['reply'].lower() or len(response['products']) > 0:
        print("\nFAILURE: AI is still hallucinating or returning products!")
    else:
        print("\nSUCCESS: AI correctly identified empty catalog or didn't invent products.")

if __name__ == "__main__":
    test_hallucination_prevention()
