from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
import random
from django.conf import settings
from datetime import datetime, timedelta
from django.core.mail import EmailMessage, send_mail
from django.contrib.sites.shortcuts import get_current_site
from django.contrib.auth import get_user_model
import jwt


# user=get_user_model()


class Util:
    @staticmethod
    def send_email(data):
        import threading
        
        def send_with_timeout():
            try:
                print(f"Attempting to send email to: {data['to_email']}")
                print(f"Email subject: {data['Subject']}")
                
                email = EmailMessage(
                    subject=data["Subject"],
                    body=data["email_body"],
                    to=[data["to_email"]],
                )
                email.send(fail_silently=False)
                print(f"Email sent successfully to {data['to_email']}")
            except Exception as e:
                print(f"Email send error: {e}")
                print(f"Email settings - HOST: {settings.EMAIL_HOST}, PORT: {settings.EMAIL_PORT}")
        
        # Run email sending in a separate thread with 10 second timeout
        thread = threading.Thread(target=send_with_timeout)
        thread.daemon = True  # Don't block app shutdown
        thread.start()
        thread.join(timeout=10)  # Wait max 10 seconds
        
        if thread.is_alive():
            print(f"Email sending timed out after 10 seconds for {data['to_email']}")
            # Thread continues in background, but we return immediately


def user_email(request, user):
    try:
        print(f"Starting email verification for user: {user.email}")
        print(f"Current SITE_URL: {settings.SITE_URL}")
        
        expiration = datetime.utcnow() + timedelta(hours=24)
        token = jwt.encode(
            {"user_id": user.id, "exp": expiration, "iat": datetime.utcnow()},
            settings.SECRET_KEY,
            algorithm="HS256",
        )
        # Use production frontend URL for email verification
        absurl = f"https://vinvest-app.vercel.app/email-verification?token={token}" 
        
        print(f"Generated verification URL: {absurl}")

        email_body = f"""
        Hi {user.email},
        
        Thank you for registering! Please click the link below to verify your account:
        
        {absurl}
        
        This link will expire in 24 hours.
        """

        data = {
            "email_body": email_body,
            "to_email": user.email,
            "Subject": "Verify Your Email",
        }
        
        print(f"Email data prepared: {data}")
        Util.send_email(data)
        print(f"Email verification process completed for {user.email}")
        
    except Exception as e:
        print(f"Error in user_email function: {e}")
        # Don't raise the exception to prevent registration failure
        # The user will still be created but won't receive verification email


def generate_six_digit_code():
    return str(random.randint(100000, 999999))


def send_reset_code(user, code):
    try:
        subject = "Reset Password Code"
        message = f"Use this code {code} to reset your password"
        email_sender = settings.EMAIL_HOST_USER
        email_reciever = [user.email]
        
        print(f"Attempting to send reset code email to: {user.email}")
        print(f"Email settings - HOST: {settings.EMAIL_HOST}, USER: {settings.EMAIL_HOST_USER}")
        
        send_mail(subject, message, email_sender, email_reciever)
        print(f"Reset code email sent successfully to {user.email}")
    except Exception as e:
        print(f"Failed to send reset code email: {e}")
        # Don't raise the exception to prevent 500 errors
        # The user will still get a success message to prevent email enumeration
