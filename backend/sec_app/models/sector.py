from django.db import models
from backend.basemodel import TimeBaseModel

class Sector(TimeBaseModel):
    name = models.CharField(max_length=255, unique=True, db_index=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name_plural = "sectors"


