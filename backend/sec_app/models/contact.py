from django.db import models

class Contact(models.Model):
    fullname = models.CharField(max_length=255)
    email = models.EmailField()
    company = models.CharField(max_length=255)
    phone = models.CharField(max_length=255)
    message = models.TextField(max_length=1000)

    def __str__(self):
        return self.fullname