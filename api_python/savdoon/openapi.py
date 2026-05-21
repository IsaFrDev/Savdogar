from drf_spectacular.extensions import OpenApiAuthenticationExtension
from stores.authentication import StoreApiKeyAuthentication

class StoreApiKeyAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = StoreApiKeyAuthentication
    name = 'Store-API-Key' # This is how it will show up in Swagger

    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'header',
            'name': 'X-Store-API-Key',
            'description': 'Store API Key for authenticating storefront requests'
        }
