from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
    label = 'accounts'  # Now unique since folder is 'accounts' not 'account'

    def ready(self):
        # Import for side-effects to register signal handlers
        from . import signals  # noqa: F401
