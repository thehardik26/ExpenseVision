from decimal import Decimal
from datetime import date
from .models import Category, Budget

def ensure_user_default_budgets(user):
    """
    Creates starter category budgets for a user if they don't have any budgets for current month.
    """
    if not user or not getattr(user, "is_authenticated", False):
        return

    today = date.today()
    current_month = today.month
    current_year = today.year

    if Budget.objects.filter(user=user, month=current_month, year=current_year).exists():
        return

    default_categories = [
        ("Food & Dining", "Essential", "#10B981", "utensils", Decimal("8000.00")),
        ("Shopping", "Discretionary", "#F59E0B", "shopping-bag", Decimal("5000.00")),
        ("Utilities", "Essential", "#3B82F6", "zap", Decimal("4000.00")),
        ("Transportation", "Essential", "#6366F1", "car", Decimal("3000.00")),
        ("Entertainment", "Discretionary", "#EC4899", "film", Decimal("2500.00")),
        ("Health & Wellness", "Essential", "#14B8A6", "heart", Decimal("2000.00")),
    ]

    for cat_name, cat_type, color, icon, limit in default_categories:
        cat, _ = Category.objects.get_or_create(
            name=cat_name,
            defaults={"category_type": cat_type, "color": color, "icon": icon}
        )
        Budget.objects.get_or_create(
            user=user,
            category=cat,
            month=current_month,
            year=current_year,
            defaults={"monthly_limit": limit}
        )
