from decimal import Decimal
from datetime import date
from .models import Category, Budget

CATEGORY_ALIASES = {
    "food & dining": "Food & Drinks",
    "food & drinks": "Food & Drinks",
    "food and drinks": "Food & Drinks",
    "food and dining": "Food & Drinks",
    "dining": "Food & Drinks",
    "restaurants": "Food & Drinks",
    "restaurant": "Food & Drinks",
    "coffee": "Food & Drinks",
    "utilities": "Bills & Utilities",
    "bills & utilities": "Bills & Utilities",
    "bills and utilities": "Bills & Utilities",
    "bills": "Bills & Utilities",
    "electricity": "Bills & Utilities",
    "water": "Bills & Utilities",
    "groceries": "Groceries",
    "grocery": "Groceries",
    "supermarket": "Groceries",
    "shopping": "Shopping",
    "retail": "Shopping",
    "clothing": "Shopping",
    "transport": "Transportation",
    "transportation": "Transportation",
    "travel": "Transportation",
    "fuel": "Transportation",
    "gas": "Transportation",
    "uber": "Transportation",
    "entertainment": "Entertainment",
    "movies": "Entertainment",
    "cinema": "Entertainment",
    "housing": "Housing",
    "rent": "Housing",
    "home": "Housing",
    "health & wellness": "Health & Wellness",
    "health and wellness": "Health & Wellness",
    "fitness": "Health & Wellness",
    "medical": "Health & Wellness",
    "salary": "Income",
    "income": "Income",
    "other": "Other",
}

CANONICAL_METADATA = {
    "Food & Drinks": {"type": "Essential", "color": "#10B981", "icon": "utensils"},
    "Shopping": {"type": "Discretionary", "color": "#F59E0B", "icon": "shopping-bag"},
    "Bills & Utilities": {"type": "Essential", "color": "#3B82F6", "icon": "zap"},
    "Transportation": {"type": "Essential", "color": "#6366F1", "icon": "car"},
    "Housing": {"type": "Essential", "color": "#06B6D4", "icon": "home"},
    "Entertainment": {"type": "Discretionary", "color": "#EC4899", "icon": "film"},
    "Health & Wellness": {"type": "Essential", "color": "#14B8A6", "icon": "heart"},
    "Groceries": {"type": "Essential", "color": "#84CC16", "icon": "shopping-cart"},
    "Income": {"type": "Income", "color": "#8B5CF6", "icon": "briefcase"},
    "Other": {"type": "Discretionary", "color": "#64748B", "icon": "tag"},
}


def get_or_create_canonical_category(name_or_alias, default_type=None):
    """
    Normalizes category names and aliases into unified canonical Category models.
    """
    clean_name = str(name_or_alias).strip()
    canonical_name = CATEGORY_ALIASES.get(clean_name.lower(), clean_name)
    meta = CANONICAL_METADATA.get(canonical_name, {
        "type": default_type or "Discretionary",
        "color": "#7C3AED",
        "icon": "tag"
    })
    cat, _ = Category.objects.get_or_create(
        name=canonical_name,
        defaults={
            "category_type": meta["type"],
            "color": meta["color"],
            "icon": meta["icon"]
        }
    )
    return cat


def ensure_user_default_budgets(user, month=None, year=None):
    """
    Creates starter category budgets for a user for the target month/year if they don't have any budgets.
    """
    if not user:
        return

    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    if Budget.objects.filter(user=user, month=target_month, year=target_year).exists():
        return

    default_categories = [
        ("Food & Drinks", Decimal("8000.00")),
        ("Shopping", Decimal("5000.00")),
        ("Bills & Utilities", Decimal("4000.00")),
        ("Transportation", Decimal("3000.00")),
        ("Housing", Decimal("15000.00")),
        ("Entertainment", Decimal("2500.00")),
        ("Health & Wellness", Decimal("2000.00")),
    ]

    for cat_name, limit in default_categories:
        cat = get_or_create_canonical_category(cat_name)
        Budget.objects.get_or_create(
            user=user,
            category=cat,
            month=target_month,
            year=target_year,
            defaults={"monthly_limit": limit}
        )
