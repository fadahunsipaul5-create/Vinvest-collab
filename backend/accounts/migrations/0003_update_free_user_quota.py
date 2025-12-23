# Generated manually to update free users with 10 questions
from django.db import migrations

def update_free_user_quota(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Update free plan users who have 0 questions to have 10 questions
    User.objects.filter(
        subscription_plan='free', 
        questions_remaining=0
    ).update(questions_remaining=10)

def reverse_update_free_user_quota(apps, schema_editor):
    # Reverse operation - set back to 0 if needed
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_questions_remaining_user_stripe_customer_id_and_more'),
    ]

    operations = [
        migrations.RunPython(update_free_user_quota, reverse_update_free_user_quota),
    ]
