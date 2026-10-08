import re
from datetime import datetime, date
from rest_framework import serializers
from .models import Category, Transaction, Budget, AIChatHistory
from django.db.models import Sum
from decimal import Decimal

from .utils import get_or_create_canonical_category

def normalize_date_string(val):
    if not val:
        return str(date.today())
    if isinstance(val, (date, datetime)):
        return val.strftime("%Y-%m-%d")

    val_str = str(val).strip()
    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d.%m.%Y",
        "%d-%b-%Y",
        "%d %b %Y",
        "%b %d, %Y",
        "%B %d, %Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return val_str

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "category_type", "icon", "color"]


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True, default="")

    class Meta:
        model = Transaction
        fields = [
            "id", "user", "user_username", "transaction_type", "category", "category_name",
            "category_color", "category_icon", "amount", "date",
            "merchant", "notes", "ai_scanned", "receipt_image", "created_at"
        ]
        read_only_fields = ["user"]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        
        cat_input = data.get("category_name") or data.get("category")
        if cat_input and not str(cat_input).isdigit():
            cat = get_or_create_canonical_category(str(cat_input).strip())
            data["category"] = cat.id

        date_input = data.get("date")
        if date_input:
            data["date"] = normalize_date_string(date_input)

        amt_input = data.get("amount")
        if amt_input is not None:
            clean_amt = re.sub(r"[^\d.]", "", str(amt_input))
            if clean_amt:
                data["amount"] = clean_amt

        img_val = data.get("receipt_image")
        if img_val in ("", "null", "undefined", None):
            data.pop("receipt_image", None)

        return super().to_internal_value(data)


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_type = serializers.CharField(source="category.category_type", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True, default="")
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    is_over_budget = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            "id", "user", "user_username", "category", "category_name", "category_type",
            "category_color", "monthly_limit", "month", "year",
            "spent", "remaining", "percentage", "is_over_budget"
        ]
        read_only_fields = ["user"]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        cat_input = data.get("category_name") or data.get("category")
        cat_type = data.get("category_type", "Essential")
        if cat_input and not str(cat_input).isdigit():
            cat = get_or_create_canonical_category(str(cat_input).strip(), default_type=cat_type)
            data["category"] = cat.id
        return super().to_internal_value(data)

    def get_spent(self, obj):
        cat_names = [obj.category.name]
        if obj.category.name == "Food & Drinks":
            cat_names.append("Food & Dining")
        elif obj.category.name == "Bills & Utilities":
            cat_names.append("Utilities")
        elif obj.category.name == "Utilities":
            cat_names.append("Bills & Utilities")
        elif obj.category.name == "Food & Dining":
            cat_names.append("Food & Drinks")

        total = Transaction.objects.filter(
            user=obj.user,
            category__name__in=cat_names,
            transaction_type="Expense",
            date__year=obj.year,
            date__month=obj.month
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        return float(total)

    def get_remaining(self, obj):
        spent = Decimal(str(self.get_spent(obj)))
        return float(max(Decimal("0.00"), obj.monthly_limit - spent))

    def get_percentage(self, obj):
        spent = Decimal(str(self.get_spent(obj)))
        if obj.monthly_limit > 0:
            return min(100, round(float((spent / obj.monthly_limit) * 100), 1))
        return 0

    def get_is_over_budget(self, obj):
        spent = Decimal(str(self.get_spent(obj)))
        return spent > obj.monthly_limit


class AIChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatHistory
        fields = ["id", "user", "session_id", "role", "message", "created_at"]
