from django.db import models
from accounts.models import User
import json

class ChatBatch(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_batches')
    title = models.CharField(max_length=255, default="New Chat")
    messages = models.JSONField(default=list)  # Array of {role: 'user'|'assistant', content: 'text', timestamp: 'iso'}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({getattr(self.user, 'email', 'Unknown')})"

    @property
    def message_count(self):
        return len(self.messages)

    def update_title_from_first_message(self):
        """Update the title based on the first user message"""
        if self.messages:
            first_user_message = next((msg for msg in self.messages if msg.get('role') == 'user'), None)
            if first_user_message and first_user_message.get('content'):
                # Truncate to 50 characters and add ellipsis if needed
                title = first_user_message['content'][:50]
                if len(first_user_message['content']) > 50:
                    title += "..."
                self.title = title
                self.save()

    def add_message(self, role, content, timestamp=None):
        """Add a message to the batch"""
        from datetime import datetime
        if timestamp is None:
            timestamp = datetime.now().isoformat()
        
        message = {
            'role': role,
            'content': content,
            'timestamp': timestamp
        }
        self.messages.append(message)
        self.save()