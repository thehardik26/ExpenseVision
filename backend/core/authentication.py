from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication without CSRF enforcement for Single Page Application API calls.
    """
    def enforce_csrf(self, request):
        return
