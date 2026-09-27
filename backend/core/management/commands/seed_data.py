from django.core.management.base import BaseCommand
from core.models import Category, Transaction, Budget
from datetime import date
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seeds initial ExpenseVision categories, transactions, and budgets matching the design'

    def handle(self, *args, **kwargs):
        self.stdout.write("Clearing old data...")
        Transaction.objects.all().delete()
        Budget.objects.all().delete()
        Category.objects.all().delete()

        self.stdout.write("Creating Categories...")
        categories_data = [
            {'name': 'Food & Drinks', 'type': 'Essential', 'icon': '☕', 'color': '#3B82F6'},
            {'name': 'Shopping', 'type': 'Discretionary', 'icon': '🛒', 'color': '#F59E0B'},
            {'name': 'Transportation', 'type': 'Essential', 'icon': '🚗', 'color': '#6366F1'},
            {'name': 'Entertainment', 'type': 'Discretionary', 'icon': '🍿', 'color': '#EC4899'},
            {'name': 'Bills & Utilities', 'type': 'Essential', 'icon': '⚡', 'color': '#10B981'},
            {'name': 'Housing', 'type': 'Essential', 'icon': '🏠', 'color': '#06B6D4'},
            {'name': 'Groceries', 'type': 'Essential', 'icon': '🥬', 'color': '#14B8A6'},
            {'name': 'Income', 'type': 'Income', 'icon': '💼', 'color': '#10B981'},
        ]

        cat_objs = {}
        for c in categories_data:
            obj, _ = Category.objects.get_or_create(
                name=c['name'],
                category_type=c['type'],
                icon=c['icon'],
                color=c['color']
            )
            cat_objs[c['name']] = obj

        self.stdout.write("Creating Budgets...")
        budgets_data = [
            ('Food & Drinks', Decimal('500.00')),
            ('Shopping', Decimal('300.00')),
            ('Transportation', Decimal('250.00')),
            ('Entertainment', Decimal('300.00')),
            ('Bills & Utilities', Decimal('600.00')),
            ('Housing', Decimal('1500.00')),
            ('Groceries', Decimal('400.00')),
        ]
        for cat_name, limit in budgets_data:
            Budget.objects.create(
                category=cat_objs[cat_name],
                monthly_limit=limit,
                month=4,
                year=2025
            )

        self.stdout.write("Creating Transactions matching PDF...")
        transactions_data = [
            ('Expense', 'Shopping', Decimal('85.25'), date(2025, 4, 15), 'Amazon', 'Home office supplies'),
            ('Expense', 'Food & Drinks', Decimal('34.50'), date(2025, 4, 15), 'Starbucks', 'Coffee with colleagues'),
            ('Expense', 'Entertainment', Decimal('120.00'), date(2025, 4, 14), 'Cinema', 'Movie night'),
            ('Expense', 'Housing', Decimal('1200.00'), date(2025, 4, 1), 'Rent Payment', 'Monthly rent'),
            ('Income', 'Income', Decimal('3450.00'), date(2025, 4, 1), 'Salary', 'Monthly salary'),
            ('Income', 'Income', Decimal('900.00'), date(2025, 4, 10), 'Freelance Client', 'Consulting gig'),
            ('Expense', 'Food & Drinks', Decimal('65.30'), date(2025, 4, 8), 'Grocery Store', 'Weekly grocery shopping'),
            ('Expense', 'Transportation', Decimal('42.99'), date(2025, 4, 10), 'Gas Station', 'Fuel'),
            ('Expense', 'Bills & Utilities', Decimal('89.99'), date(2025, 4, 5), 'Internet Provider', 'Monthly internet bill'),
            ('Expense', 'Shopping', Decimal('224.75'), date(2025, 4, 12), 'Zara & Target', 'Clothing and essentials'),
        ]

        for tx_type, cat_name, amt, dt, merchant, notes in transactions_data:
            Transaction.objects.create(
                transaction_type=tx_type,
                category=cat_objs[cat_name],
                amount=amt,
                date=dt,
                merchant=merchant,
                notes=notes
            )

        self.stdout.write(self.style.SUCCESS("Successfully loaded PDF initial dataset!"))
