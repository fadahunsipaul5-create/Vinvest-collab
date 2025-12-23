from django.contrib import admin
from .models import User, ResetPassword

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "subscription_plan",
        "subscription_status",
        "questions_remaining",
        "subscription_period_end",
    )
    search_fields = ("email", "stripe_customer_id", "stripe_subscription_id")

admin.site.register(ResetPassword)
