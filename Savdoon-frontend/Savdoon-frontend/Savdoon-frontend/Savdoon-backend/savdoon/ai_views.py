from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([AllowAny])
def translate_product_view(request):
    return Response({"message": "Stub"})

@api_view(['POST'])
@permission_classes([AllowAny])
def enhance_signature(request):
    return Response({"enhanced_signature": request.data.get('signature_data', '')})

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_signatures_view(request):
    return Response({"variants": []})

@api_view(['POST'])
@permission_classes([AllowAny])
def enhance_description(request):
    return Response({"variants": [request.data.get('description', '')]})

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_description_view(request):
    return Response({"description": ""})

@api_view(['POST'])
@permission_classes([AllowAny])
def analyze_logo_view(request):
    """
    Extracts dominant colors from an uploaded image and harmonizes them.
    Expects 'image_data' as base64 or an actual uploaded file.
    """
    import base64
    import io
    from PIL import Image
    from collections import Counter

    image_data = request.data.get('image_data')
    if not image_data:
        return Response({"error": "No image data provided"}, status=400)

    try:
        # Handle base64
        if 'base64,' in image_data:
            header, encoded = image_data.split('base64,')
            image_bytes = base64.b64decode(encoded)
        else:
            image_bytes = base64.b64decode(image_data)
        
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert('RGB')
        # Resize to speed up analysis
        img.thumbnail((150, 150))
        
        colors = list(img.getdata())
        
        # Filter out very bright/white and very dark/black pixels to find meaningful colors
        meaningful_colors = [
            c for c in colors 
            if not (c[0] > 240 and c[1] > 240 and c[2] > 240) # skip white
            and not (c[0] < 15 and c[1] < 15 and c[2] < 15) # skip black
        ]
        
        if not meaningful_colors:
            meaningful_colors = colors

        # Count frequencies
        color_counts = Counter(meaningful_colors)
        most_common = color_counts.most_common(10)
        
        palette = []
        for c, count in most_common:
            hex_color = '#{:02x}{:02x}{:02x}'.format(c[0], c[1], c[2]).upper()
            if hex_color not in palette:
                palette.append(hex_color)
                if len(palette) >= 5:
                    break
        
        if not palette:
            palette = ["#6366F1", "#8B5CF6", "#F43F5E", "#10B981", "#F59E0B"]

        primary = palette[0]
        secondary = palette[1] if len(palette) > 1 else palette[0]
        
        return Response({
            "primary": primary,
            "secondary": secondary,
            "palette": palette,
            "suggestion": "We've analyzed your logo and picked these professional colors to match your brand identity.",
            "font_family": "Inter",
            "border_radius": "2rem",
            "layout": "modern"
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_business_view(request):
    """
    Analyzes business description and suggests features/categories.
    """
    description = request.data.get('description', '')
    business_type = request.data.get('business_type', 'other')
    
    # Mock analysis for now, can be improved with actual AI logic later
    summary = f"Your {business_type} business '{description[:30]}...' is a great fit for our platform."
    
    return Response({
        "is_allowed": True,
        "reason": "Business complies with our terms of service.",
        "suggested_features": ["AI Inventory", "Smart Marketing", "Telegram Bot"],
        "suggested_category": business_type,
        "summary": summary
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot_view(request):
    return Response({"reply": "Offline"})