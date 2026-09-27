import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from .utils import ensure_user_default_budgets

def get_user_data(user, token_str=None):
    """
    Standard serialized representation of a Django user for the frontend.
    """
    if not token_str:
        token, _ = Token.objects.get_or_create(user=user)
        token_str = token.key
        
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    parts = full_name.split()
    if len(parts) >= 2:
        initials = (parts[0][0] + parts[1][0]).upper()
    else:
        initials = full_name[:2].upper() if full_name else "US"

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email or f"{user.username}@local.dev",
        "name": full_name,
        "avatar": initials,
        "is_superuser": user.is_superuser,
        "is_staff": user.is_staff,
        "token": token_str,
    }


class LoginView(APIView):
    """
    Standard Email / Username and Password Sign-In.
    Authenticates directly against Django User models.
    Tries exact username, case-insensitive username, and email.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = str(request.data.get("username") or request.data.get("email") or "").strip()
        password = str(request.data.get("password") or "").strip()

        if not identifier or not password:
            return Response(
                {"error": "Please provide both username/email and password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Collect candidate users: exact username match first
        candidates = list(User.objects.filter(username=identifier))
        # Then case-insensitive username or email
        for u in User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)):
            if u not in candidates:
                candidates.append(u)

        authenticated_user = None
        for candidate in candidates:
            auth_u = authenticate(request, username=candidate.username, password=password)
            if auth_u:
                authenticated_user = auth_u
                break

        # If not authenticated yet, try direct authenticate with identifier
        if not authenticated_user:
            authenticated_user = authenticate(request, username=identifier, password=password)

        if not authenticated_user:
            return Response(
                {"error": f"Invalid credentials for '{identifier}'. Please check your password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Ensure user has their own budgets created
        ensure_user_default_budgets(authenticated_user)

        # Log into Django session so browser has access to Django Admin
        login(request, authenticated_user)

        # Issue/retrieve DRF Token for API requests
        token, _ = Token.objects.get_or_create(user=authenticated_user)
        user_payload = get_user_data(authenticated_user, token.key)

        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": user_payload,
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """
    User Registration / Sign Up.
    Creates a real Django User, initializes their own default budgets,
    logs them in, and returns auth token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = str(request.data.get("username") or "").strip()
        email = str(request.data.get("email") or "").strip()
        password = str(request.data.get("password") or "").strip()
        name = str(request.data.get("name") or "").strip()

        if not username:
            if email:
                username = email.split("@")[0]
            else:
                return Response({"error": "Username or email is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not password:
            return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({"error": f'Username "{username}" is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email__iexact=email).exists():
            return Response({"error": f'Email "{email}" is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        name_parts = name.split()
        first_name = name_parts[0] if name_parts else username
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Ensure newly registered user has their own separate starter budgets in INR
        ensure_user_default_budgets(user)

        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        user_payload = get_user_data(user, token.key)

        return Response({
            "message": "Account registered successfully",
            "token": token.key,
            "user": user_payload
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """
    Logs out the user from the Django session.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    Returns the currently authenticated user based on Token or Session.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            token, _ = Token.objects.get_or_create(user=request.user)
            return Response({
                "is_authenticated": True,
                "user": get_user_data(request.user, token.key)
            })

        return Response({
            "is_authenticated": False,
            "user": {
                "id": None,
                "username": "Guest",
                "name": "Guest User",
                "email": "",
                "avatar": "GU",
                "is_superuser": False,
                "is_staff": False,
                "token": None
            }
        })


class GoogleLoginView(APIView):
    """
    Handles Google OAuth 2.0 Sign-In.
    Accepts Google ID token/credential, verifies user identity,
    provisions Django user, and returns session + DRF token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = str(request.data.get("email") or "").strip()
        name = str(request.data.get("name") or "").strip()
        token = request.data.get("credential")

        google_client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        if token and google_client_id:
            try:
                from google.oauth2 import id_token
                from google.auth.transport import requests as google_requests
                id_info = id_token.verify_oauth2_token(token, google_requests.Request(), google_client_id)
                email = id_info.get("email", email)
                name = id_info.get("name", name or email.split("@")[0])
            except Exception as e:
                print(f"[Google Auth Verify Error]: {e}")

        if not email:
            return Response({"error": "Email is required for Google login"}, status=status.HTTP_400_BAD_REQUEST)

        username = email.split("@")[0]
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "first_name": name or username}
        )

        ensure_user_default_budgets(user)
        login(request, user)
        token_obj, _ = Token.objects.get_or_create(user=user)
        user_payload = get_user_data(user, token_obj.key)

        return Response({
            "message": "Google authentication successful",
            "token": token_obj.key,
            "user": user_payload
        })
