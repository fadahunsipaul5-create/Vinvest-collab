from django.db import models
from account.models import User
from .chat_session import ChatSession

class ChatHistory(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.TextField()
    answer = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = getattr(self.user, 'username', 'Unknown')
        timestamp_str = str(self.timestamp) if self.timestamp else 'Unknown'
        return f"{username} - {timestamp_str}"