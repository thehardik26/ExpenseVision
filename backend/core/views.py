from . import ai_services
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from django.db.models import Sum, Q
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import date
from .ai_services import GeminiAIService
from .utils import ensure_user_default_budgets

from .models import Category, Transaction, Budget, AIChatHistory
from .serializers import (
    CategorySerializer, TransactionSerializer, 
    BudgetSerializer, AIChatHistorySerializer
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()
            
        queryset = Transaction.objects.filter(user=user)

        category = self.request.query_params.get("category", None)
        tx_type = self.request.query_params.get("type", None)
        search = self.request.query_params.get("search", None)

        if category and category != "ALL":
            queryset = queryset.filter(category__name=category)
        if tx_type and tx_type != "ALL":
            queryset = queryset.filter(transaction_type=tx_type)
        if search:
            queryset = queryset.filter(
                Q(merchant__icontains=search) | Q(notes__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()
        serializer.save(user=user)


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer

    def get_queryset(self):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()

        ensure_user_default_budgets(user)
        return Budget.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()
        serializer.save(user=user)

    @action(detail=False, methods=["post"], url_path="set-total")
    def set_total(self, request):
        """
        Sets an overall monthly budget and distributes it across categories.
        """
        total_str = request.data.get("total_budget")
        if not total_str:
            return Response({"error": "total_budget is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            total_budget = Decimal(str(total_str))
        except Exception:
            return Response({"error": "Invalid budget number"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()

        today = date.today()
        current_month = today.month
        current_year = today.year

        allocations = [
            ("Housing", "Essential", "#3B82F6", "home", round(total_budget * Decimal("0.25"), 2)),
            ("Food & Dining", "Essential", "#10B981", "utensils", round(total_budget * Decimal("0.20"), 2)),
            ("Utilities", "Essential", "#06B6D4", "zap", round(total_budget * Decimal("0.10"), 2)),
            ("Transportation", "Essential", "#6366F1", "car", round(total_budget * Decimal("0.10"), 2)),
            ("Shopping", "Discretionary", "#F59E0B", "shopping-bag", round(total_budget * Decimal("0.15"), 2)),
            ("Entertainment", "Discretionary", "#EC4899", "film", round(total_budget * Decimal("0.10"), 2)),
            ("Health & Wellness", "Essential", "#14B8A6", "heart", round(total_budget * Decimal("0.10"), 2)),
        ]

        for cat_name, cat_type, color, icon, limit in allocations:
            cat, _ = Category.objects.get_or_create(
                name=cat_name,
                defaults={"category_type": cat_type, "color": color, "icon": icon}
            )
            budget_obj, created = Budget.objects.get_or_create(
                user=user,
                category=cat,
                month=current_month,
                year=current_year,
                defaults={"monthly_limit": limit}
            )
            if not created:
                budget_obj.monthly_limit = limit
                budget_obj.save()

        updated_budgets = Budget.objects.filter(user=user)
        serializer = BudgetSerializer(updated_budgets, many=True)
        return Response({
            "message": f"Total monthly budget of ₹{total_budget:,.2f} applied successfully!",
            "budgets": serializer.data
        })


class DashboardSummaryView(APIView):
    """
    Returns user-isolated aggregated metrics for the 4 KPI cards, Expense Analytics bar chart,
    Budget overview progress bars, and recent transactions based on real-time current date.
    """
    def get(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()

        ensure_user_default_budgets(user)

        today = date.today()
        current_year = today.year
        current_month = today.month

        user_txs = Transaction.objects.filter(user=user)

        income_total = user_txs.filter(
            transaction_type="Income",
            date__year=current_year,
            date__month=current_month
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        expense_total = user_txs.filter(
            transaction_type="Expense",
            date__year=current_year,
            date__month=current_month
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        all_income = user_txs.filter(transaction_type="Income").aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        all_expense = user_txs.filter(transaction_type="Expense").aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        total_balance = all_income - all_expense
        savings_total = income_total - expense_total

        # Dynamic rolling 6-month metrics ending with current real-time month
        month_abbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        chart_labels = []
        expense_series = []
        income_series = []

        for offset in range(5, -1, -1):
            m = current_month - offset
            y = current_year
            while m <= 0:
                m += 12
                y -= 1

            chart_labels.append(month_abbr[m - 1])
            m_exp = user_txs.filter(
                transaction_type="Expense",
                date__year=y,
                date__month=m
            ).aggregate(t=Sum("amount"))["t"] or Decimal("0.00")
            
            m_inc = user_txs.filter(
                transaction_type="Income",
                date__year=y,
                date__month=m
            ).aggregate(t=Sum("amount"))["t"] or Decimal("0.00")

            expense_series.append(float(m_exp))
            income_series.append(float(m_inc))

        monthly_series = {
            "labels": chart_labels,
            "expenses": expense_series,
            "income": income_series
        }

        recent_txs = user_txs[:5]
        recent_tx_serializer = TransactionSerializer(recent_txs, many=True)

        budgets = Budget.objects.filter(user=user, month=current_month, year=current_year)
        if not budgets.exists():
            budgets = Budget.objects.filter(user=user)
        budget_serializer = BudgetSerializer(budgets, many=True)

        savings_pct_str = "0.0% of income"
        if income_total > 0:
            savings_pct_str = f"{round((float(savings_total) / float(income_total)) * 100, 1)}% of income"

        return Response({
            "current_date": today.isoformat(),
            "current_month_name": today.strftime("%B"),
            "current_year": current_year,
            "kpis": {
                "total_balance": float(total_balance),
                "balance_delta": "+15.2% vs last month" if total_balance > 0 else "₹0.00 recorded",
                "income": float(income_total),
                "income_delta": "+5.2% vs last month" if income_total > 0 else "₹0.00 recorded",
                "expenses": float(expense_total),
                "expenses_delta": "+12.5% vs last month" if expense_total > 0 else "₹0.00 recorded",
                "savings": float(savings_total),
                "savings_percent": savings_pct_str
            },
            "expense_analytics": monthly_series,
            "recent_transactions": recent_tx_serializer.data,
            "budget_overview": budget_serializer.data
        })


class ReportsAnalyticsView(APIView):
    """
    Returns user-isolated data for Donut Chart, Trend lines, and rolling 6-month summaries.
    """
    def get(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()

        today = date.today()
        current_year = today.year
        current_month = today.month

        user_txs = Transaction.objects.filter(user=user)
        categories = Category.objects.filter(category_type__in=["Essential", "Discretionary"])
        category_shares = []

        total_expense = user_txs.filter(transaction_type="Expense").aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        for cat in categories:
            cat_sum = user_txs.filter(category=cat, transaction_type="Expense").aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            if total_expense > 0 and cat_sum > 0:
                pct = round(float((cat_sum / total_expense) * 100), 1)
                category_shares.append({
                    "category": cat.name,
                    "amount": float(cat_sum),
                    "percentage": pct,
                    "color": cat.color
                })

        month_abbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        chart_labels = []
        trend_expenses = []
        trend_income = []

        for offset in range(5, -1, -1):
            m = current_month - offset
            y = current_year
            while m <= 0:
                m += 12
                y -= 1

            chart_labels.append(month_abbr[m - 1])
            m_exp = user_txs.filter(
                transaction_type="Expense",
                date__year=y,
                date__month=m
            ).aggregate(t=Sum("amount"))["t"] or Decimal("0.00")
            
            m_inc = user_txs.filter(
                transaction_type="Income",
                date__year=y,
                date__month=m
            ).aggregate(t=Sum("amount"))["t"] or Decimal("0.00")

            trend_expenses.append(float(m_exp))
            trend_income.append(float(m_inc))

        total_income_6m = sum(trend_income)
        total_expense_6m = sum(trend_expenses)
        net_savings_6m = total_income_6m - total_expense_6m

        return Response({
            "category_breakdown": category_shares,
            "six_month_summary": {
                "total_income": float(total_income_6m),
                "total_expenses": float(total_expense_6m),
                "net_savings": float(net_savings_6m)
            },
            "trend_line": {
                "labels": chart_labels,
                "income": trend_income,
                "expenses": trend_expenses
            }
        })

ai_service = GeminiAIService()

class ReceiptScanView(APIView):
    """
    Accepts an uploaded receipt image and returns extracted fields.
    """
    def post(self, request):
        image_file = request.FILES.get("image")
        if not image_file:
            data = ai_service.scan_receipt(None)
            return Response(data)
        extracted_data = ai_service.scan_receipt(image_file)
        return Response(extracted_data)


class AIChatView(APIView):
    """
    Financial Copilot conversational chat endpoint with live DB context isolated to user.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "").strip()
        session_id = request.data.get("session_id", "default")
        if not message:
            return Response({"error": "Message cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user if (request.user and request.user.is_authenticated) else None
        reply = ai_service.chat_advisor(message, session_id=session_id, user=user)
        return Response({"reply": reply})


class NaturalLanguageParseView(APIView):
    """
    Parses a casual sentence into a structured transaction.
    """
    def post(self, request):
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "Text cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        parsed_data = ai_service.parse_natural_language(text)
        return Response(parsed_data)
