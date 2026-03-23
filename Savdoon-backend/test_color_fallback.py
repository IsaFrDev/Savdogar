
import os
import django
import sys
import base64
from pathlib import Path
from io import BytesIO

# Setup Django environment
sys.path.append(str(Path(__file__).resolve().parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from savdoon.ai_views import local_color_analysis

def test_local_fallback():
    # Create a 1x1 blue pixel image in base64
    from PIL import Image
    buffered = BytesIO()
    img = Image.new('RGB', (10, 10), color='#123456')
    img.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    print("Testing local color analysis fallback...")
    result = local_color_analysis(img_str)
    
    if result and result['primary'].lower() == '#123456':
        print(f"SUCCESS: Local fallback correctly extracted primary color {result['primary']}")
        print(f"Full Result: {result}")
    else:
        print(f"FAILURE: Expected #123456, got {result.get('primary') if result else 'None'}")

if __name__ == "__main__":
    test_local_fallback()
