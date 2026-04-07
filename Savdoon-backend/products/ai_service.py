import os
import random
from google import genai
from pathlib import Path
from dotenv import load_dotenv

def log_ai_error(msg):
    try:
        with open(os.path.join(os.path.dirname(__file__), 'ai_errors.log'), 'a', encoding='utf-8') as f:
            f.write(f"{msg}\n")
    except:
        pass

# Force load .env from backend root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Configure Gemini
# GEMINI_API_KEY is now loaded dynamically in AIService.__init__

class AIService:
    _model_names = [
        'gemini-1.5-flash', 
        'gemini-2.0-flash',
        'gemini-1.5-pro'
    ]

    def __init__(self):
        self.clients = []
        self.current_client_index = 0
        
        # Load keys dynamically from environment
        gemini_api_key = os.getenv('GEMINI_API_KEY', '')
        
        # Support comma-separated keys or single key
        raw_keys = gemini_api_key.split(',') if gemini_api_key else []
        api_keys = [k.strip() for k in raw_keys if k.strip()]
        
        if api_keys:
            for key in api_keys:
                try:
                    client = genai.Client(api_key=key)
                    self.clients.append(client)
                except Exception as e:
                    log_ai_error(f"Failed to initialize Gemini Client for key {key[:8]}...: {e}")
        
        if not self.clients:
            log_ai_error("CRITICAL: No valid GEMINI_API_KEYS were initialized.")

    def _get_model_names(self, model_type='text'):
        if model_type == 'vision':
            return ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
        return self._model_names

    def _safe_generate_content(self, model_names, prompt, contents=None):
        """Try multiple clients (API keys) and multiple models until one works."""
        if not self.clients:
            raise Exception("No AI Clients available. Check your GEMINI_API_KEY.")

        last_error = None
        num_clients = len(self.clients)
        
        # Outer loop: Try each available API key (client)
        for _ in range(num_clients):
            client = self.clients[self.current_client_index]
            
            # Inner loop: Try each model for the current client
            for name in model_names:
                try:
                    if contents:
                        actual_contents = [prompt] + (contents if isinstance(contents, list) else [contents])
                        response = client.models.generate_content(
                            model=name,
                            contents=actual_contents
                        )
                    else:
                        response = client.models.generate_content(
                            model=name,
                            contents=prompt
                        )
                    return response.text.strip()
                except Exception as e:
                    last_error = e
                    error_str = str(e).lower()
                    
                    # Log detail to help debugging
                    log_ai_error(f"Error for key {self.current_client_index}, model {name}: {error_str[:100]}...")
                    
                    # If it's a rate limit or quota error, rotate this key immediately
                    if any(x in error_str for x in ["429", "quota", "exhausted", "limit"]):
                        log_ai_error(f"Key {self.current_client_index} exhausted (429/Quota). Rotating...")
                        break # Break model loop to switch client
                        
                    continue # Try next model with same client
            
            # If we reach here, either the model loop finished (all models failed for this key) 
            # or we broke out due to a quota error. In both cases, try next client for next request.
            self.current_client_index = (self.current_client_index + 1) % num_clients
            
        raise last_error if last_error else Exception("All AI clients and models exhausted")

    def generate_description(self, name, category_name=None, language='uz'):
        """
        Generates a professional product description using Gemini or templates.
        """
        if self.clients:
            try:
                prompt = f"Create a professional, short, and engaging product description for: {name} in category: {category_name}. Language: {language}. Return only the description."
                model_names = self._get_model_names('text')
                return self._safe_generate_content(model_names, prompt)
            except Exception as e:
                log_ai_error(f"Description error: {e}")

        # Fallback to templates if Gemini fails
        templates = {
            'uz': ["Ushbu {name} - yuqori sifat va zamonaviy dizayn uyg'unligi. {category} toifasidagi eng sara mahsulotlardan biri."],
            'ru': ["Этот {name} — сочетание высокого качества и современного дизайна. Один из лучших продуктов в категории {category}."],
            'en': ["This {name} is a combination of high quality and modern design. One of the best products in the {category} category."]
        }
        category = category_name or "products"
        lang_templates = templates.get(language, templates['en'])
        return random.choice(lang_templates).format(name=name, category=category)

    def generate_marketing_post(self, name, description, platform='instagram', language='uz'):
        """
        Generates a viral marketing post for social media using Gemini.
        """
        if self.clients:
            try:
                prompt = f"""
                Create a viral marketing post for {platform} in {language}.
                Product: {name}
                Description: {description}
                
                The post should be engaging, include emojis, and 3-5 relevant hashtags.
                Return only the post content.
                """
                model_names = self._get_model_names('text')
                return self._safe_generate_content(model_names, prompt)
            except Exception as e:
                log_ai_error(f"Marketing error: {e}")
        
        return f"🔥 NEW ARRIVAL: {name}!\n\nCheck out our latest product. Quality guaranteed.\n\n#shop #new #quality"

    def moderate_content(self, content):
        """
        Simplified content moderation using Gemini if available.
        """
        if self.clients:
            try:
                prompt = f"Moderate the following product content: '{content}'. Is it appropriate for an e-commerce store? Respond with 'SAFE' or 'UNSAFE: Reason'."
                model_names = self._get_model_names('text')
                response = self._safe_generate_content(model_names, prompt)
                if 'UNSAFE' in response:
                    return False, response.replace('UNSAFE:', '').strip()
                return True, ''
            except:
                pass
        return True, ''

    def generate_seo_tags(self, name, description, language='uz'):
        """
        Generates SEO keywords/tags for a product.
        """
        if self.clients:
            try:
                prompt = f"Generate 5-10 SEO keywords (comma-separated tags) for the following product in {language}.\nProduct: {name}\nDescription: {description}\nReturn ONLY the comma-separated words without quotes."
                model_names = self._get_model_names('text')
                return self._safe_generate_content(model_names, prompt)
            except Exception as e:
                log_ai_error(f"SEO error: {e}")
        return f"{name}, e-commerce, shop"

    def translate_text(self, text, target_lang):
        """
        Translates text to the target language (ru or uz).
        """
        if not text:
            return ""
            
        if self.clients:
            try:
                prompt = f"Translate the following text into {target_lang}. Return ONLY the translated text without any quotes, explanations, or original text:\n\n{text}"
                model_names = self._get_model_names('text')
                return self._safe_generate_content(model_names, prompt)
            except Exception as e:
                log_ai_error(f"Translation error: {e}")
        return ""

    def chat(self, message, history, product_context, store_info, language='uz'):
        """
        Robust AI Chat using the best available Gemini model.
        """
        if self.clients:
            try:
                system_prompt = f"""
                You are a professional and friendly AI shopping assistant for the store "{store_info.get('name', 'Savdoon')}".
                Business type: {store_info.get('business_type', 'Retail')}
                
                STRICT CATALOG ENFORCEMENT:
                1. You ONLY know about the products listed in "Available products".
                2. If a product is NOT listed, it is NOT available. NEVER invent or hallucinate products.
                3. If no products match, politely inform the user.
                
                Available products:
                {product_context or "EMPTY CATALOG: No products are currently listed in this store."}
                
                CRITICAL INSTRUCTIONS:
                1. LANGUAGE SYNC: You MUST respond EXCLUSIVELY in the language: {language}.
                2. NO HALLUCINATION: Strictly follow the product list above.
                3. CONCISE: Keep your response short and helpful (1-3 sentences).
                """
                
                full_prompt = f"{system_prompt}\n\nUser: {message}\nAssistant:"
                model_names = self._get_model_names('text')
                return self._safe_generate_content(model_names, full_prompt)
            except Exception as e:
                log_ai_error(f"Chat error: {e}")
        
        # --- ROBUST FALLBACK ---
        fallback_msg = {
            'uz': f"Kechirasiz, hozirda AI xizmati band. {store_info.get('name', 'Savdoon')} do'koni mahsulotlari haqida savolingiz bo'lsa, iltimos operator bilan bog'laning yoki birozdan so'ng yozing.",
            'ru': f"Извините, сейчас ИИ-сервис перегружен. Если у вас есть вопросы по товарам магазина {store_info.get('name', 'Savdoon')}, пожалуйста, свяжитесь с оператором.",
            'en': f"Sorry, the AI service is currently busy. If you have questions about {store_info.get('name', 'Savdoon')} products, please contact our support."
        }
        return fallback_msg.get(language, fallback_msg['en'])

    def generate_ui_config(self, user_prompt, business_type, current_config=None, current_schema=None, current_html=None, current_files=None):
        """
        Generates a new theme_config JSON based on user natural language.
        Now supports full HTML template modification for deep customization.
        """
        if not self.clients:
            return current_config or {}

        try:
            # Default schema representing the basic current storefront if none exists
            default_schema = [
                {"type": "Header", "props": {"style": "minimalist"}},
                {"type": "HeroBanner", "props": {"visible": True}},
                {"type": "SearchArea", "props": {"glassmorphism": False}},
                {"type": "ProductsArea", "props": {"columns": 2, "card_style": "default"}}
            ]
            active_schema = current_schema if current_schema else default_schema

            system_prompt = f"""
            You are a senior UI/UX Designer and Frontend Architect specializing in E-commerce.
            Your task is to manage a structured storefront project (Explorer Mode).
            A project consists of multiple files (HTML, CSS, JS) and organized folders.
            
            BUSINESS CONTEXT:
            - Store Type: {business_type}
            - Current Design Config: {current_config or "Default"}
            - Current UI Schema (Layout Array): {active_schema}
            - Current File Tree (JSON Map Path -> Content): {current_files or "None (Empty)"}
            
            PROJECT STRUCTURE RULES:
            - Entry Point: You MUST have an 'index.html'.
            - Modular Design: Encourage separate files like 'css/style.css' and 'js/app.js'.
            - Relative Path Resolution: When linking CSS/JS in 'index.html', use relative paths like '<link href="css/style.css">'.
            - Dynamic Placeholders: 
              - MUST include {{PRODUCTS_GRID}} in 'index.html' where the dynamic store content should go.
              - Use {{STORE_NAME}}, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}}, {{ACCENT_COLOR}} as placeholders.
              - NAVIGATION: For store owners to return to the dashboard from the preview, use `onclick="window.backToAdmin()"` on any back/exit buttons.
            
            AI ACTION GUIDELINES:
            - If the user asks for a simple style change (e.g., "make it dark and red"), update the relevant CSS files or 'theme_config'.
            - If the user asks for structural changes (e.g., "add a new banner section"), update 'index.html' or add a new component file.
            - If no files exist yet, GENERATE a complete professional starter project including:
               1. 'index.html' (using {{PRODUCTS_GRID}})
               2. 'css/style.css' (premium modern designs, mesh gradients, glassmorphism)
               3. 'js/main.js' (subtle animations or interactions)
            
            JSON RESPONSE FORMAT (Strict JSON):
            {{
              "primary_color": "hex",
              "secondary_color": "hex",
              "accent_color": "hex",
              "ai_logic_summary": "Uzbek explanation of architectural changes.",
              "ui_schema": [...],
              "store_files": {{
                 "index.html": "...",
                 "css/style.css": "...",
                 "js/main.js": "..."
              }}
            }}
            
            CRITICAL RULES:
            1. Return ONLY valid JSON. No markdown. No triple backticks.
            2. Never use comments like // inside JSON.
            3. Ensure the 'store_files' map contains the FULL project if changes are significant.
            4. If only one file changes, you can return just that file in the map, AND the existing ones to keep the state.
            
            USER REQUEST: "{user_prompt}"
            """
            
            response_text = ""
            try:
                model_names = self._get_model_names('text')
                response_text = self._safe_generate_content(model_names, system_prompt)
            except Exception as e:
                log_ai_error(f"AI content generation failed: {e}")
                raise Exception(f"AI bilan bog'lanishda xatolik: {str(e)[:100]}")
            
            import json
            import re
            
            # Robust JSON extraction
            try:
                # Find the first { and the last }
                start = response_text.find('{')
                end = response_text.rfind('}')
                if start != -1 and end != -1:
                    json_str = response_text[start:end+1]
                    # Strip out any // comments just in case the AI hallucinations
                    json_str = re.sub(r'//.*?\n', '\n', json_str)
                    return json.loads(json_str)
            except:
                pass

            # Fallback to older regex cleaning if block search fails
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            response_text = re.sub(r'//.*?\n', '\n', response_text)
            return json.loads(response_text)
        except Exception as e:
            log_ai_error(f"UI Config generation error: {e}\nResponse was: {response_text[:200]}...")
            raise Exception(f"AI javobini o'qishda xatolik: {str(e)[:50]}. Iltimos qaytadan urinib ko'ring yoki boshqacharoq buyruq bering.")

ai_service = AIService()
