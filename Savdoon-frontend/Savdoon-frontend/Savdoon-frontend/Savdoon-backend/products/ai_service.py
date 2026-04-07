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
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

class AIService:
    _model_names = [
        'gemini-1.5-flash', 
        'gemini-2.0-flash',
        'gemini-1.5-pro'
    ]

    def __init__(self):
        self.client = None
        if GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=GEMINI_API_KEY)
            except Exception as e:
                log_ai_error(f"CRITICAL: Failed to initialize Gemini Client: {e}")
        else:
            log_ai_error("CRITICAL: GEMINI_API_KEY is not set.")

    def _get_model_names(self, model_type='text'):
        if model_type == 'vision':
            return ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
        return self._model_names

    def _safe_generate_content(self, model_names, prompt, contents=None):
        """Try multiple models until one works."""
        if not self.client:
            raise Exception("AI Client not initialized")

        last_error = None
        for name in model_names:
            try:
                if contents:
                    actual_contents = [prompt] + (contents if isinstance(contents, list) else [contents])
                    response = self.client.models.generate_content(
                        model=name,
                        contents=actual_contents
                    )
                else:
                    response = self.client.models.generate_content(
                        model=name,
                        contents=prompt
                    )
                return response.text.strip()
            except Exception as e:
                last_error = e
                log_ai_error(f"Attempt with {name} failed: {e}")
                continue
        raise last_error if last_error else Exception("No models available")

    def generate_description(self, name, category_name=None, language='uz'):
        """
        Generates a professional product description using Gemini or templates.
        """
        if self.client:
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
        if self.client:
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
        if self.client:
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
        if self.client:
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
            
        if self.client:
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
        if self.client:
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
        return None

ai_service = AIService()
