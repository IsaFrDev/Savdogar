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
            ai_data = ai_service.generate_ui_config(
                user_prompt=user_prompt,
                business_type=store.get_business_type_display(),
                current_config=store.theme_config,
                current_schema=store.ui_schema,
                current_html=store.store_html,
                current_files=store.store_files
            )
            
            # Update store colors if AI suggested them
            if 'primary_color' in ai_data:
                store.primary_color = ai_data['primary_color']
            if 'secondary_color' in ai_data:
                store.secondary_color = ai_data['secondary_color']
            if 'accent_color' in ai_data:
                store.accent_color = ai_data['accent_color']
                
            store.theme_config = ai_data.get('theme_config', store.theme_config)
            store.ui_schema = ai_data.get('ui_schema', store.ui_schema)
            store.store_html = ai_data.get('store_html', store.store_html)
            store.store_files = ai_data.get('store_files', store.store_files)
            store.save()
            
            return Response({
                "message": "Store design updated successfully!",
                "theme_config": store.theme_config,
                "ui_schema": store.ui_schema,
                "store_html": store.store_html,
                "store_files": store.store_files,
                "ai_reply": ai_data.get('ai_logic_summary', "Loyiha muvaffaqiyatli yangilandi.")
            })
            
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class StoreBuilderSchemaUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        ui_schema = request.data.get('ui_schema')
        
        if not store_id or ui_schema is None:
            return Response({"error": "store_id and ui_schema are required"}, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            store.ui_schema = ui_schema
            store.save()
            return Response({
                "message": "Schema updated successfully",
                "ui_schema": store.ui_schema
            })
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class StoreBuilderHtmlUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        store_html = request.data.get('store_html')
        
        if not store_id or store_html is None:
            return Response({"error": "store_id and store_html are required"}, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            store.store_html = store_html
            store.save()
            return Response({
                "message": "HTML updated successfully",
                "store_html": store.store_html
            })
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
class StoreBuilderFilesUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        store_files = request.data.get('store_files')
        
        if not store_id or store_files is None:
            return Response({"error": "store_id and store_files are required"}, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            store.store_files = store_files
            store.save()
            return Response({
                "message": "Files updated successfully",
                "store_files": store.store_files
            })
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
