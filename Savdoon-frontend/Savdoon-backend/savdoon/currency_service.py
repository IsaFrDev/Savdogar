import requests
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

class CurrencyService:
    CBU_API_URL = "https://cbu.uz/uz/arkhiv-kursov-valyut/json/"
    CACHE_KEY = "cbu_rates"

    @classmethod
    def get_rates(cls):
        rates = cache.get(cls.CACHE_KEY)
        if rates: return rates
        try:
            processed = {"USD": 12850.0, "RUB": 140.0}
            res = requests.get(cls.CBU_API_URL, timeout=10)
            data = res.json()
            for item in data:
                if item['Ccy'] in processed: processed[item['Ccy']] = float(item['Rate'])
            cache.set(cls.CACHE_KEY, processed, 3600 * 12)
            return processed
        except Exception: return {"USD": 12850.0, "RUB": 140.0}

currency_service = CurrencyService()
