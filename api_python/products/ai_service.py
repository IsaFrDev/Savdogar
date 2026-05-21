import os
import random
import json
from google import genai
from google.genai import types
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

class AIService:
    """
    Savdoon AI Service with support for multiple providers (Gemini & OpenRouter).
    Uses specific API keys for different services (Forecast, Builder, Concierge, etc.)
    to optimize costs and manage rate limits independently.
    """
    
    # Model presets for optimization
    MODEL_PRESETS = {
        'fast': 'gemini-2.0-flash', # Efficient, fast, low cost
        'smart': 'gemini-1.5-pro',  # High reasoning, higher cost
        'builder': 'google/gemini-2.0-flash-exp:free', # OpenRouter example or Gemini
    }

    def __init__(self, service_type='general'):
        self.clients = []
        self.current_client_index = 0
        self.service_type = service_type
        
        # Mapping service types to environment variables
        KEY_MAPPING = {
            'forecast': 'AI_FORECAST_KEY',
            'builder': 'AI_BUILDER_KEY',
            'concierge': 'AI_CONCIERGE_KEY',
            'general': 'GEMINI_API_KEY'
        }
        
        env_var = KEY_MAPPING.get(service_type, 'GEMINI_API_KEY')
        api_key_str = os.getenv(env_var, os.getenv('GEMINI_API_KEY', ''))
        
        # Support comma-separated keys for rotation
        raw_keys = api_key_str.split(',') if api_key_str else []
        api_keys = [k.strip() for k in raw_keys if k.strip()]
        
        if api_keys:
            for key in api_keys:
                try:
                    # Check if it's an OpenAI-compatible key (OpenRouter or DeepSeek)
                    if key.startswith('sk-or-'):
                        client = self._init_openai_compatible_client(key, "https://openrouter.ai/api/v1")
                    elif key.startswith('sk-') and service_type == 'builder':
                        # DeepSeek typically uses sk- keys and is OpenAI compatible
                        client = self._init_openai_compatible_client(key, "https://api.deepseek.com/v1")
                    else:
                        client = genai.Client(api_key=key)
                    
                    if client:
                        self.clients.append(client)
                except Exception as e:
                    log_ai_error(f"Failed to initialize AI Client for {service_type} (key {key[:8]}...): {e}")
        
        if not self.clients:
            log_ai_error(f"CRITICAL: No valid API keys for service '{service_type}'.")

    def _init_openai_compatible_client(self, key, base_url):
        """Initialize a client for OpenAI-compatible APIs (OpenRouter, DeepSeek)"""
        class OpenAICompatibleClient:
            def __init__(self, api_key, url):
                self.api_key = api_key
                self.base_url = url
                self.is_openai_compatible = True
                self.is_openrouter = "openrouter" in url
                import requests
                self.session = requests.Session()

            class Models:
                def __init__(self, parent):
                    self.parent = parent

                def generate_content(self, model, contents, config=None):
                    url = f"{self.parent.base_url}/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {self.parent.api_key}",
                        "Content-Type": "application/json",
                    }
                    if self.parent.is_openrouter:
                        headers["HTTP-Referer"] = "https://savdoon.uz"
                        headers["X-Title"] = "Savdoon AI"
                    
                    # Convert GenAI format to OpenAI format
                    messages = []
                    if config and hasattr(config, 'system_instruction'):
                        messages.append({"role": "system", "content": config.system_instruction})
                    
                    if isinstance(contents, list):
                        prompt = " ".join([str(c) for c in contents])
                    else:
                        prompt = str(contents)
                    
                    messages.append({"role": "user", "content": prompt})
                    
                    payload = {
                        "model": model,
                        "messages": messages,
                        "temperature": 0.7,
                    }
                    
                    # Optimization for DeepSeek
                    if "deepseek" in self.parent.base_url:
                        if "reasoner" in model:
                            payload["model"] = "deepseek-reasoner"
                        else:
                            payload["model"] = "deepseek-chat"
                    # Optimization for OpenRouter
                    elif self.parent.is_openrouter and "flash" in model:
                        payload["model"] = "google/gemini-2.0-flash-exp:free"
                    
                    response = self.parent.session.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    
                    class AIResponse:
                        def __init__(self, text):
                            self.text = text
                    
                    return AIResponse(data['choices'][0]['message']['content'])

            @property
            def models(self):
                return self.Models(self)

        return OpenAICompatibleClient(key, base_url)

    def _get_model_names(self, model_type='text'):
        # Optimize: Default to flash for almost everything to save cost
        if self.service_type == 'builder':
            return ['gemini-2.0-flash', 'gemini-1.5-pro']
        if model_type == 'vision':
            return ['gemini-1.5-flash', 'gemini-2.0-flash']
        return ['gemini-2.0-flash', 'gemini-1.5-flash']

    def _safe_generate_content(self, model_names, prompt, contents=None, system_instruction=None):
        """Try multiple clients (API keys) and multiple models until one works."""
        if not self.clients:
            raise Exception(f"No AI Clients available for {self.service_type}.")

        last_error = None
        num_clients = len(self.clients)
        
        # Token optimization: Strip whitespace and limit prompt size if needed
        prompt = prompt.strip()
        
        for _ in range(num_clients):
            client = self.clients[self.current_client_index]
            
            # Configure generation
            config = None
            if system_instruction:
                # Handle both GenAI and OpenAI-compatible formats
                if hasattr(client, 'is_openai_compatible'):
                    class MockConfig:
                        def __init__(self, si): self.system_instruction = si
                    config = MockConfig(system_instruction)
                else:
                    config = types.GenerateContentConfig(system_instruction=system_instruction)
            
            # Inner loop: Try each model for the current client
            for name in model_names:
                try:
                    # Cost optimization: Ensure we use provider-specific models
                    if hasattr(client, 'is_openai_compatible') and not (name.startswith('google/') or name.startswith('openai/') or name.startswith('deepseek')):
                        # Map generic names
                        if 'flash' in name:
                            name = 'google/gemini-2.0-flash-exp:free' if client.is_openrouter else 'deepseek-chat'
                        elif 'pro' in name:
                            name = 'google/gemini-1.5-pro' if client.is_openrouter else 'deepseek-chat'

                    if contents:
                        actual_contents = [prompt] + (contents if isinstance(contents, list) else [contents])
                        response = client.models.generate_content(
                            model=name,
                            contents=actual_contents,
                            config=config
                        )
                    else:
                        response = client.models.generate_content(
                            model=name,
                            contents=prompt,
                            config=config
                        )
                    return response.text.strip()
                except Exception as e:
                    last_error = e
                    error_str = str(e).lower()
                    log_ai_error(f"Error for {self.service_type} index {self.current_client_index}, model {name}: {error_str[:100]}")
                    
                    if any(x in error_str for x in ["429", "quota", "exhausted", "limit"]):
                        break 
                    continue 
            
            self.current_client_index = (self.current_client_index + 1) % num_clients
            
        raise last_error if last_error else Exception("All AI clients and models exhausted")

    # The following methods are kept for backward compatibility but now use the optimized logic
    def generate_description(self, name, category_name=None, language='uz'):
        system_instruction = "You are a professional e-commerce copywriter. Create short, engaging product descriptions. Max 2 sentences."
        user_prompt = f"Product: {name}, Category: {category_name}, Lang: {language}. Return only description."
        return self._safe_generate_content(self._get_model_names(), user_prompt, system_instruction=system_instruction)

    def generate_marketing_post(self, name, description, platform='instagram', language='uz'):
        system_instruction = f"You are an SMM expert. Create a viral {platform} post in {language}."
        user_prompt = f"Product: {name}, Desc: {description}. Include emojis and 3 tags."
        return self._safe_generate_content(self._get_model_names(), user_prompt, system_instruction=system_instruction)

    def moderate_content(self, content):
        prompt = f"Moderate: '{content}'. SAFE or UNSAFE: Reason."
        response = self._safe_generate_content(self._get_model_names(), prompt)
        if 'UNSAFE' in response:
            return False, response.replace('UNSAFE:', '').strip()
        return True, ''

    def generate_seo_tags(self, name, description, language='uz'):
        system_instruction = "SEO specialist. Generate 5-7 comma-separated keywords."
        user_prompt = f"Product: {name}, Desc: {description}, Lang: {language}."
        return self._safe_generate_content(self._get_model_names(), user_prompt, system_instruction=system_instruction)

    def translate_text(self, text, target_lang):
        if not text: return ""
        system_instruction = f"Translator. Translate to {target_lang}."
        user_prompt = f"Translate accurately:\n\n{text}"
        return self._safe_generate_content(self._get_model_names(), user_prompt, system_instruction=system_instruction)

    def chat(self, message, history, product_context, store_info, language='uz'):
        system_instruction = f"""
        Friendly assistant for "{store_info.get('name', 'Savdoon')}".
        Catalog: {product_context or "No products."}
        Rules: 1. Only mentioned products. 2. Lang: {language}. 3. Concise (1-2 sentences).
        """
        user_prompt = f"User: {message}"
        return self._safe_generate_content(self._get_model_names(), user_prompt, system_instruction=system_instruction)

    def generate_ui_config(self, user_prompt, business_type, current_config=None, current_schema=None, current_html=None, current_files=None):
        system_instruction = f"""
        UX Designer for {business_type} store. 
        Return ONLY STRICT JSON. No markdown. No triple backticks.
        JSON schema: {{"ai_logic_summary": "uz", "store_files": {{"index.html": "...", "css/style.css": "..."}}}}
        Placeholders: {{{{PRODUCTS_GRID}}}}, {{{{STORE_NAME}}}}, {{{{PRIMARY_COLOR}}}}.
        """
        # Builder uses specific models if available
        models = self._get_model_names()
        return self._parse_json_response(self._safe_generate_content(models, user_prompt, system_instruction=system_instruction))

    def _parse_json_response(self, response_text):
        import re
        try:
            # Remove markdown code blocks
            response_text = re.sub(r'```json\s*', '', response_text)
            response_text = re.sub(r'```\s*', '', response_text)
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(response_text[start:end+1])
        except:
            pass
        return {"error": "Failed to parse AI response"}

# Default instances for different services
ai_service = AIService(service_type='general')
builder_ai_service = AIService(service_type='builder')
forecast_ai_service = AIService(service_type='forecast')
concierge_ai_service = AIService(service_type='concierge')
