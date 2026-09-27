from django.contrib import admin
from .models import Category, Transaction, Budget, AIChatHistory

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category_type", "color", "icon")
    list_filter = ("category_type",)
    search_fields = ("name",)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "merchant", "category", "transaction_type", "amount", "user", "ai_scanned")
    list_filter = ("transaction_type", "category", "date", "ai_scanned", "user")
    search_fields = ("merchant", "notes", "user__username", "user__email")
    ordering = ("-date", "-id")

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("id", "category", "monthly_limit", "month", "year", "user")
    list_filter = ("year", "month", "user")

@admin.register(AIChatHistory)
class AIChatHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "session_id", "role", "created_at")
