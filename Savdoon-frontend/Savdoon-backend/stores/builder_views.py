from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Store
from products.ai_service import ai_service

class StoreBuilderChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        user_prompt = request.data.get('message')
        
        if not store_id or not user_prompt:
            return Response({"error": "store_id and message are required"}, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            
            # Generate new config using AI
            new_config = ai_service.generate_ui_config(
                user_prompt=user_prompt,
                business_type=store.get_business_type_display(),
                current_config=store.theme_config
            )
            
            # Update store colors if AI suggested them in the config
            if 'primary_color' in new_config:
                store.primary_color = new_config['primary_color']
            if 'secondary_color' in new_config:
                store.secondary_color = new_config['secondary_color']
            if 'accent_color' in new_config:
                store.accent_color = new_config['accent_color']
                
            store.theme_config = new_config
            store.save()
            
            return Response({
                "message": "Store design updated successfully!",
                "theme_config": new_config,
                "ai_reply": new_config.get('ai_logic_summary', "Dizayn muvaffaqiyatli yangilandi.")
            })
            
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
