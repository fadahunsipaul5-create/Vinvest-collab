from django.db import models
from account.models import User
from .chat_session import ChatSession

class ChatHistory(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.TextField(blank=True, null=True)  # User message
    answer = models.TextField()  # AI response
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        username = getattr(self.user, 'username', 'Unknown')
        timestamp_str = str(self.timestamp) if self.timestamp else 'Unknown'
        return f"{username} - {timestamp_str}"

    def save(self, *args, **kwargs):
        # Update session title if this is the first user message
        if self.question and not self.session.messages.filter(question__isnull=False).exclude(id=self.id).exists():
            self.session.update_title_from_first_message()
        super().save(*args, **kwargs) 