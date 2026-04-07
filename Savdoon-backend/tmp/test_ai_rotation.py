import sys
import os
from unittest.mock import MagicMock, patch

# Add the project path to sys.path
BASE_DIR = r"c:\Users\hp\Desktop\Savdoon\Savdoon-backend"
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Mocking GEMINI_API_KEY environment variable
with patch.dict(os.environ, {"GEMINI_API_KEY": "KEY1, KEY2"}):
    # Mocking the genai library
    with patch('google.genai.Client') as mock_client_class:
        # Setup mock clients
        mock_client1 = MagicMock()
        mock_client2 = MagicMock()
        
        # Client 1 will throw a 429 error on first call
        mock_client1.models.generate_content.side_effect = Exception("429: Resource has been exhausted (e.g. check quota).")
        
        # Client 2 will succeed
        mock_success_response = MagicMock()
        mock_success_response.text = "Success from Key 2"
        mock_client2.models.generate_content.return_value = mock_success_response
        
        # Configure the mock class to return these clients sequentially
        mock_client_class.side_effect = [mock_client1, mock_client2]
        
        # Now import and test
        from products.ai_service import AIService
        
        print("Initializing AIService with mock keys...")
        service = AIService()
        
        print(f"Number of initialized clients: {len(service.clients)}")
        
        print("Triggering content generation...")
        try:
            result = service.generate_description("Test Product", "Electronics")
            print(f"Result: {result}")
            
            # Since we have only 2 clients, after rotating from index 0, current_client_index should be 1
            # OR if it already rotated and finished the loop, it might stick at 1.
            
            if result == "Success from Key 2":
                print("\n✅ VERIFICATION SUCCESSFUL: System rotated to Key 2 after Key 1 failed.")
            else:
                print(f"\n❌ VERIFICATION FAILED: Unexpected result: {result}")
                
            print(f"Current client index (after rotation): {service.current_client_index}")
            
        except Exception as e:
            print(f"\n❌ VERIFICATION FAILED: Raised exception: {e}")
