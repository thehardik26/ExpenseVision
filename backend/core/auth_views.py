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

        candidates = list(User.objects.filter(username=identifier))
        for u in User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)):
            if u not in candidates:
                candidates.append(u)

        authenticated_user = None
        for candidate in candidates:
            auth_u = authenticate(request, username=candidate.username, password=password)
            if auth_u:
                authenticated_user = auth_u
                break

        if not authenticated_user:
            authenticated_user = authenticate(request, username=identifier, password=password)

        if not authenticated_user:
            return Response(
                {"error": f"Invalid credentials for '{identifier}'. Please check your password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        ensure_user_default_budgets(authenticated_user)
        login(request, authenticated_user)

        token, _ = Token.objects.get_or_create(user=authenticated_user)
        user_payload = get_user_data(authenticated_user, token.key)

        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": user_payload,
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
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
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
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


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from django.core.mail import send_mail

        email = str(request.data.get("email") or "").strip()
        if not email:
            return Response({"error": "Email is required to request a password reset."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.filter(username__iexact=email).first()

        if not user:
            return Response(
                {"error": f"No account found matching '{email}'."},
                status=status.HTTP_404_NOT_FOUND
            )

        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        
        try:
            send_mail(
                subject="ExpenseVision - Password Reset Request",
                message=f"Hello {user.first_name or user.username},\n\nUse token: {token}\nUID: {uidb64}\nto reset your ExpenseVision password.",
                from_email="noreply@expensevision.com",
                recipient_list=[user.email or email],
                fail_silently=True
            )
        except Exception as e:
            pass

        return Response({
            "message": f"Password reset instructions have been generated for {user.email or email}.",
            "uidb64": uidb64,
            "token": token,
            "username": user.username
        })


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        uidb64 = request.data.get("uidb64")
        token = str(request.data.get("token") or "").strip()
        new_password = str(request.data.get("new_password") or "").strip()
        identifier = str(request.data.get("email") or request.data.get("username") or "").strip()

        if not new_password:
            return Response({"error": "New password cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        if uidb64:
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except Exception:
                user = None

        if not user and identifier:
            user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()

        if not user:
            return Response({"error": "Invalid reset link or user not found."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Reset token is invalid or has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)

        return Response({
            "message": "Password reset successful! You can now sign in with your new password.",
            "token": new_token.key,
            "user": get_user_data(user, new_token.key)
        })
