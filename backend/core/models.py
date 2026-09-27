from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class Category(models.Model):
    CATEGORY_CHOICES = [
        ("Essential", "Essential"),
        ("Discretionary", "Discretionary"),
        ("Income", "Income"),
    ]

    name = models.CharField(max_length=100, unique=True)
    category_type = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="Discretionary")
    icon = models.CharField(max_length=50, default="tag", help_text="Icon name or emoji")
    color = models.CharField(max_length=20, default="#7C3AED", help_text="Hex color code")

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("Expense", "Expense"),
        ("Income", "Income"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default="Expense")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    merchant = models.CharField(max_length=150, help_text="Merchant or Payee name")
    notes = models.TextField(blank=True, null=True)

    ai_scanned = models.BooleanField(default=False, help_text="True if auto-extracted from receipt via Gemini")
    receipt_image = models.ImageField(upload_to="receipts/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        sign = "+" if self.transaction_type == "Income" else "-"
        return f"{self.merchant} ({sign}₹{self.amount}) - {self.date}"

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="budgets")
    monthly_limit = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.PositiveSmallIntegerField(default=4)  
    year = models.PositiveIntegerField(default=2025)

    class Meta:
        unique_together = ("user", "category", "month", "year")

    def __str__(self):
        user_name = self.user.username if self.user else "Global"
        return f"[{user_name}] {self.category.name} Budget: ₹{self.monthly_limit} ({self.month}/{self.year})"

class AIChatHistory(models.Model):
    session_id = models.CharField(max_length=100, db_index=True)
    role = models.CharField(max_length=10, choices=[("user", "User"), ("model", "Gemini AI")])
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        
    def __str__(self):
        return f"[{self.role}] {self.message[:40]}..."
