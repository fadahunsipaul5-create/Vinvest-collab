from django.db import models
from django.conf import settings

class ChatSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=255, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({getattr(self.user, 'email', 'Unknown')})"

    @property
    def message_count(self):
        return self.messages.count()

    def update_title_from_first_message(self):
        """Update the title based on the first user message"""
        first_message = self.messages.filter(question__isnull=False).exclude(question='').first()
        if first_message and first_message.question:
            # Truncate to 50 characters and add ellipsis if needed
            title = first_message.question[:50]
            if len(first_message.question) > 50:
                title += "..."
            self.title = title
            self.save() 