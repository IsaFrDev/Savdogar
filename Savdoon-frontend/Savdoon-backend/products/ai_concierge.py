from .models import Product
from .ai_service import ai_service
from .serializers import ProductSerializer
from stores.models import Store

class AIConcierge:
    @staticmethod
    def chat(store_id, message, store_name=None, language='uz'):
        """
        Processes a user message for a specific store using AI.
        Gathers context and returns a structured response.
        """
        # --- GREETING HEURISTIC ---
        # Instant response for common greetings in UZ/RU/EN to bypass AI quota/latency
        greetings = {
            'uz': ['salom', 'assalom', 'qandaysiz', 'hayrli kun', 'qalaysiz'],
            'ru': ['привет', 'здравствуйте', 'салoм', 'добрый день', 'как дела'],
            'en': ['hi', 'hello', 'hey', 'good morning', 'how are you']
        }
        
        msg_lower = message.lower().strip()
        is_greeting = any(g in msg_lower for lang in greetings.values() for g in lang)
        
        if is_greeting:
            responses = {
                'uz': f"Assalomu alaykum! Men {store_name or 'Savdoon'} do'konining AI yordamchisiman. Sizga qanday yordam bera olaman?",
                'ru': f"Здравствуйте! Я ИИ-помощник магазина {store_name or 'Savdoon'}. Чем я могу вам помочь?",
                'en': f"Hello! I am the AI assistant for {store_name or 'Savdoon'}. How can I help you today?"
            }
            return {
                "reply": responses.get(language, responses['en']),
                "products": []
            }
        # --------------------------

        try:
            # 1. Get Store Info
            store = Store.objects.filter(id=store_id).first()
            store_info = {
                'name': store.name if store else (store_name or "Savdoon Store"),
                'business_type': store.business_type if store else "Retail"
            }

            # 2. Get Product Context
            # We'll fetch the first 50 products for context to keep it manageable for LLM
            products_query = Product.objects.filter(store_id=store_id)[:50]
            
            product_context = ""
            for p in products_query:
                product_context += f"- {p.name} (ID: {p.id}, Price: {p.price}, Category: {p.category.name if p.category else 'General'})\n"
            
            if not product_context:
                product_context = "No products found in this store."

            # 3. Call AI Service
            ai_reply = ai_service.chat(
                message=message,
                history=[], # Could be expanded later
                product_context=product_context,
                store_info=store_info,
                language=language
            )

            # 4. Extract Product IDs from reply (Simple heuristic)
            # Find numbers in the reply that might correspond to IDs
            import re
            found_ids = re.findall(r'ID: (\d+)', ai_reply) if ai_reply else []
            related_products = []
            
            if found_ids:
                # Resolve IDs to actual serialized products
                related_products_query = Product.objects.filter(id__in=found_ids)
                related_products = ProductSerializer(related_products_query, many=True).data

            return {
                "reply": ai_reply or "Sorry, I'm having trouble processing that right now.",
                "products": related_products
            }

        except Exception as e:
            from .ai_service import log_ai_error
            log_ai_error(f"AIConcierge.chat exception: {e}")
            return {
                "reply": "Kechirasiz, tizimda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.",
                "products": []
            }
