from django.apps import AppConfig


class AccountConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    label = 'users'

    def ready(self):
        # Import for side-effects to register signal handlers
        from . import signals  # noqa: F401
