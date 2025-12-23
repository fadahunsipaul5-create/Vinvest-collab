from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from .usermanager import UserManager
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

# Create your models here.


class User(AbstractUser):
    username = None
    email = models.EmailField(_("Email Address"), unique=True)
    first_name = models.CharField(_("First Name"), max_length=150)
    last_name = models.CharField(_("Last Name"), max_length=150)
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    
    # Subscription-related fields
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)

    PLAN_FREE = "free"
    PLAN_PRO = "pro"
    PLAN_PRO_PLUS = "pro_plus"
    PLAN_CHOICES = [
        (PLAN_FREE, "Free"),
        (PLAN_PRO, "Pro"),
        (PLAN_PRO_PLUS, "Pro Plus"),
    ]
    subscription_plan = models.CharField(max_length=50, choices=PLAN_CHOICES, default=PLAN_FREE)
    subscription_status = models.CharField(max_length=50, blank=True, null=True)  # e.g., active, past_due
    questions_remaining = models.IntegerField(default=10) 
    subscription_period_end = models.DateTimeField(blank=True, null=True)

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="account_user_groups",
        blank=True,
        help_text="The groups this user belongs to.",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="account_user_permissions",
        blank=True,
        help_text="Specific permissions for this user.",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return self.email if self.email else ""

    def token(self):
        refresh = RefreshToken.for_user(self)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}
    
    def set_plan(self, plan_name: str, quota: int | None = None, period_end=None):
        if self.is_superuser:
            return

        self.subscription_plan = plan_name
        # Use provided quota if given, else take from settings.SUBSCRIPTION_PLAN_QUOTAS
        if quota is None:
            default_quota = settings.SUBSCRIPTION_PLAN_QUOTAS.get(plan_name, 0)
            self.questions_remaining = default_quota
        else:
            self.questions_remaining = quota
        if period_end:
            self.subscription_period_end = period_end
        self.save(update_fields=["subscription_plan", "questions_remaining", "subscription_period_end"])

    def consume_question(self) -> bool:
        if self.is_superuser:
            return True

        if self.questions_remaining > 0:
            self.questions_remaining -= 1
            self.save(update_fields=["questions_remaining"])
            return True
        return False
    
    
class ResetPassword(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6,null=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Code {self.code} generated for {self.user}'

    def is_valid(self):
        return timezone.now() < self.created_at + timezone.timedelta(minutes=5)  # type: ignore