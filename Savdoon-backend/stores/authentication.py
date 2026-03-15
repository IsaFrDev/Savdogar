from rest_framework import authentication
from rest_framework import exceptions
from .models import Store

class StoreApiKeyAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('X-API-Key') or request.META.get('HTTP_X_API_KEY')
        if not api_key:
            return None
        try:
            store = Store.objects.get(api_key=api_key)
        except Store.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid API Key')
        return (store.owner, None)
