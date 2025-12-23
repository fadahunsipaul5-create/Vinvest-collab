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
                
                # Try SendGrid Web API first (uses HTTPS, not blocked by cloud platforms)
                sendgrid_api_key = settings.SENDGRID_API_KEY if hasattr(settings, 'SENDGRID_API_KEY') else None
                
                if sendgrid_api_key:
                    try:
                        from sendgrid import SendGridAPIClient
                        from sendgrid.helpers.mail import Mail
                        
                        print("Using SendGrid Web API")
                        message = Mail(
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to_emails=data['to_email'],
                            subject=data['Subject'],
                            plain_text_content=data['email_body']
                        )
                        sg = SendGridAPIClient(sendgrid_api_key)
                        response = sg.send(message)
                        print(f"Email sent successfully via SendGrid API to {data['to_email']}")
                        print(f"SendGrid response status: {response.status_code}")
                        return
                    except Exception as sg_error:
                        print(f"SendGrid API error: {sg_error}")
                        print("Falling back to SMTP...")
                
                # Fallback to SMTP if SendGrid API fails
                email = EmailMessage(
                    subject=data["Subject"],
                    body=data["email_body"],
                    to=[data["to_email"]],
                )
                email.send(fail_silently=False)
                print(f"Email sent successfully via SMTP to {data['to_email']}")
            except Exception as e:
                print(f"Email send error: {e}")
                if hasattr(settings, 'EMAIL_HOST'):
                    print(f"Email settings - HOST: {settings.EMAIL_HOST}, PORT: {settings.EMAIL_PORT}")
        
        # Run email sending in a separate thread with 15 second timeout
        thread = threading.Thread(target=send_with_timeout)
        thread.daemon = True  # Don't block app shutdown
        thread.start()
        thread.join(timeout=15)  # Wait max 15 seconds
        
        if thread.is_alive():
            print(f"Email sending timed out after 15 seconds for {data['to_email']}")
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
        
        print(f"Attempting to send reset code email to: {user.email}")
        
        # Use the Util class which handles SendGrid API and SMTP fallback
        data = {
            "email_body": message,
            "to_email": user.email,
            "Subject": subject,
        }
        Util.send_email(data)
        print(f"Reset code email process completed for {user.email}")
    except Exception as e:
        print(f"Failed to send reset code email: {e}")
        # Don't raise the exception to prevent 500 errors
        # The user will still get a success message to prevent email enumeration
