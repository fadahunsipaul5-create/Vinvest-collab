from django.db import models


class StripeEvent(models.Model):
    event_id = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=100)
    received_at = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField()

    class Meta:
        indexes = [
            models.Index(fields=["event_id"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self) -> str:
        return f"StripeEvent({self.event_id}, {self.type})"


