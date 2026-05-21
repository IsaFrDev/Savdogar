from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

@extend_schema(
    tags=['AI Features'],
    summary="Translate Product",
    request=inline_serializer("TranslateRequest", fields={"text": serializers.CharField(), "to_lang": serializers.CharField()}),
    responses={200: inline_serializer("TranslateResponse", fields={"translated_text": serializers.CharField()})}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def translate_product_view(request):
    return Response({"message": "Stub"})

@extend_schema(
    tags=['AI Features'],
    summary="Enhance Signature",
    request=inline_serializer("EnhanceSignatureRequest", fields={"signature_data": serializers.CharField()}),
    responses={200: inline_serializer("EnhanceSignatureResponse", fields={"enhanced_signature": serializers.CharField()})}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def enhance_signature(request):
    return Response({"enhanced_signature": request.data.get('signature_data', '')})

@extend_schema(
    tags=['AI Features'],
    summary="Generate Signatures",
    description="Generates stylistic signature variants for a given name.",
    request=inline_serializer("GenerateSignaturesRequest", fields={"name": serializers.CharField()}),
    responses={200: inline_serializer("GenerateSignaturesResponse", fields={"variants": serializers.ListField(child=serializers.CharField())})}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_signatures_view(request):
    return Response({"variants": []})

@extend_schema(
    tags=['AI Features'],
    summary="Enhance Description",
    description="Refines a product or store description using AI.",
    request=inline_serializer("EnhanceDescriptionRequest", fields={"description": serializers.CharField(), "style": serializers.CharField(required=False, default="professional")}),
    responses={200: inline_serializer("EnhanceDescriptionResponse", fields={"variants": serializers.ListField(child=serializers.CharField())})}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def enhance_description(request):
    return Response({"variants": [request.data.get('description', '')]})

@extend_schema(
    tags=['AI Features'],
    summary="Generate Description",
    description="Generates a full description from a brief prompt.",
    request=inline_serializer("GenerateDescriptionRequest", fields={"prompt": serializers.CharField()}),
    responses={200: inline_serializer("GenerateDescriptionResponse", fields={"description": serializers.CharField()})}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_description_view(request):
    return Response({"description": ""})

@extend_schema(
    tags=['AI Features'],
    summary="Analyze Logo Colors",
    description="Extracts dominant colors from an uploaded logo image and suggests a harmonious theme.",
    request=inline_serializer("AnalyzeLogoRequest", fields={"image_data": serializers.CharField(help_text="Base64 encoded image string")}),
    responses={200: inline_serializer("AnalyzeLogoResponse", fields={
        "primary": serializers.CharField(),
        "secondary": serializers.CharField(),
        "palette": serializers.ListField(child=serializers.CharField()),
        "suggestion": serializers.CharField(),
        "font_family": serializers.CharField(),
        "border_radius": serializers.CharField(),
        "layout": serializers.CharField()
    })}
)
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

@extend_schema(
    tags=['AI Features'],
    summary="Analyze Business Concept",
    description="Evaluates business description and suggests platform features and categories.",
    request=inline_serializer("AnalyzeBusinessRequest", fields={
        "description": serializers.CharField(),
        "business_type": serializers.CharField()
    }),
    responses={200: inline_serializer("AnalyzeBusinessResponse", fields={
        "is_allowed": serializers.BooleanField(),
        "reason": serializers.CharField(),
        "suggested_features": serializers.ListField(child=serializers.CharField()),
        "suggested_category": serializers.CharField(),
        "summary": serializers.CharField()
    })}
)
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

@extend_schema(
    tags=['AI Features'],
    summary="AI Chatbot",
    request=inline_serializer("ChatbotRequest", fields={"message": serializers.CharField()}),
    responses={200: inline_serializer("ChatbotResponse", fields={"reply": serializers.CharField()})}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot_view(request):
    return Response({"reply": "Offline"})