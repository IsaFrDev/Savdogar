from rest_framework import authentication
from rest_framework import exceptions
from .models import Store
from drf_spectacular.extensions import OpenApiAuthenticationExtension

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

class StoreApiKeyAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = StoreApiKeyAuthentication
    name = 'Store-API-Key'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'header',
            'name': 'X-Store-API-Key',
            'description': 'Store API Key for authenticating storefront requests'
        }
