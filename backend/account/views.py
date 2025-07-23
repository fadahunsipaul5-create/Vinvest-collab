from django.shortcuts import render
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.contrib.sites.shortcuts import get_current_site
from django.conf import settings
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, status, views, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny 
from rest_framework.validators import ValidationError
from rest_framework.decorators import action
from django.utils.translation import gettext_lazy as _
from .serializer import *
from rest_framework_simplejwt.tokens import RefreshToken
from .utils import Util, user_email, generate_six_digit_code, send_reset_code
from .models import ResetPassword
from datetime import datetime, timedelta
import jwt
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import requests
from google.oauth2 import id_token  
from rest_framework import permissions
from google.auth.transport import requests as google_requests
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse

User = get_user_model()

@method_decorator(csrf_exempt, name="dispatch")
class GoogleAuthView(APIView):
    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.GOOGLE_CLIENT_ID:
            print("ERROR: GOOGLE_CLIENT_ID not configured in settings")
            return Response({"error": "Server configuration error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Verify Google token with clock skew tolerance
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10  # Allow 10 seconds of clock skew
            )

            email = idinfo["email"]
            full_name = idinfo.get("name", "")
            first_name = full_name.split(" ")[0] if full_name else ""
            last_name = " ".join(full_name.split(" ")[1:]) if len(full_name.split()) > 1 else ""

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_verified": True,
                },
            )

            refresh = RefreshToken.for_user(user)

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_verified": user.is_verified,
                },
            })

        except ValueError as e:
            print(f"Google token verification error: {str(e)}")
            # Check if it's a clock skew issue
            if "too early" in str(e).lower() or "clock" in str(e).lower():
                return Response({
                    "error": "Clock synchronization issue. Please check your system time.",
                    "details": str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Google authentication error: {str(e)}")
            return Response({"error": "Authentication failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            email = data.get("email", "").lower().strip()
            password = data.get("password", "").strip()
            confirm_password = data.get("confirm_password", "").strip()

            if not all([email, password, confirm_password, first_name, last_name]):
                return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(email=email).exists():
                return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

            if password != confirm_password:
                return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=False,
                is_verified=False,
            )

            user_email(request, user)

            return Response({
                    "message": "Registration successful! Please check your email to verify your account.",
                "user": {
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_verified": user.is_verified,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Registration error:", str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = request.data.get("email", "").lower().strip()
            password = request.data.get("password", "").strip()

            print(f"Login attempt - Email: {email}, Password Provided: {'Yes' if password else 'No'}")

            if not email or not password:
                print("Missing email or password")
                return Response({"error": "Email and password are required"}, status=400)

            # Try authenticating the user
            user = authenticate(request, email=email, password=password)
            if not user:
                print("Auth by email failed, trying username...")
                user = authenticate(request, username=email, password=password)

            if not user:
                print(f"Authentication failed for email/username: {email}")
                return Response({"error": "Invalid credentials"}, status=401)

            print(f"User found: {user.email}, Verified: {user.is_verified}, Active: {user.is_active}")

            if not user.is_verified:
                print("User email not verified")
                return Response({"error": "Email not verified"}, status=401)

            if not user.is_active:
                print("User account not active")
                return Response({"error": "Account not active"}, status=401)

            refresh = RefreshToken.for_user(user)

            print("Login successful. Returning tokens.")

            return Response({
                    "message": "Login successful",
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                "user": {
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_verified": user.is_verified,
                }
            }, status=200)

        except Exception as e:
            print(f"Login error: {str(e)}")
            return Response({"error": "Login failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def logout(self, request):
        logout(request)
        return Response({"Message": _("Logout Successful")}, status=status.HTTP_200_OK)

class VerifyEmailViewSet(viewsets.GenericViewSet):
    serializer_class = VerifyEmailSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'token',
                openapi.IN_QUERY,
                description="JWT token for email verification",
                type=openapi.TYPE_STRING
            )
        ]
    )
    @action(methods=['get'], detail=False)
    def verify(self, request):
        token = request.GET.get('token')

        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            email_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user = User.objects.get(id=email_token['user_id'])

            if not user.is_verified:
                user.is_verified = True
                user.is_active = True  # Also activate the user
                user.save()
                print(f"User {user.email} verified and activated successfully")

            return Response({'message': 'User is successfully activated'}, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            return Response({'error': 'Email activation link has expired'}, status=status.HTTP_400_BAD_REQUEST)

        except jwt.DecodeError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

        except ObjectDoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def generate_token(user):
        expiration = datetime.utcnow() + timedelta(hours=24)
        payload = {
            'user_id': user.id,
            'exp': expiration,
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return token

class RequestPasswordResetEmail(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RequestPasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid input'}, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data  # type: ignore
        email = validated_data.get('email')  # type: ignore

        # Always respond the same way to prevent email enumeration
        try:
            user = User.objects.get(email=email)
            code = generate_six_digit_code()
            ResetPassword.objects.create(user=user, code=code)
            
            # Only send email in production
            if not settings.DEBUG:
                send_reset_code(user, code)
            else:
                print(f"Development mode: Reset code for {email} is {code}")
                
        except ObjectDoesNotExist:
            pass

        return Response({'message': 'If your email is registered, a reset code has been sent.'}, status=status.HTTP_200_OK)


class VerifyPasswordReset(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request):
        print(f"Password reset request data: {request.data}")
        
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            print(f"Password reset validation errors: {serializer.errors}")
            
            # Handle password validation errors with user-friendly messages
            errors = serializer.errors
            if 'new_password' in errors:
                password_errors = errors['new_password']
                user_friendly_errors = []
                
                for error in password_errors:
                    if 'too short' in str(error).lower():
                        user_friendly_errors.append('This password is too short. It must contain at least 8 characters.')
                    elif 'too common' in str(error).lower():
                        user_friendly_errors.append('This password is too common.')
                    elif 'numeric' in str(error).lower():
                        user_friendly_errors.append('This password is entirely numeric.')
                    elif 'similar' in str(error).lower():
                        user_friendly_errors.append('This password is too similar to your personal information.')
                    else:
                        user_friendly_errors.append(str(error))
                
                return Response({'error': user_friendly_errors[0] if user_friendly_errors else 'Invalid password.'}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({'error': 'Invalid input data.'}, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data  # type: ignore
        email = validated_data['email']
        code = validated_data['code']
        new_password = validated_data['new_password']
        
        print(f"Password reset validated data - Email: {email}, Code: {code}")

        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return Response({'error': 'Invalid email or code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_code = ResetPassword.objects.get(user=user, code=code)
        except ObjectDoesNotExist:
            return Response({'error': 'Invalid email or code.'}, status=status.HTTP_400_BAD_REQUEST)

        if not reset_code.is_valid():
            return Response({'error': 'Reset code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        reset_code.delete()

        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)