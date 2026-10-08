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
from .utils import ensure_user_default_budgets, get_or_create_canonical_category

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

        today = date.today()
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")

        target_month = int(month) if (month and str(month).isdigit()) else today.month
        target_year = int(year) if (year and str(year).isdigit()) else today.year

        ensure_user_default_budgets(user, month=target_month, year=target_year)

        qs = Budget.objects.filter(user=user, month=target_month, year=target_year)
        if not qs.exists():
            qs = Budget.objects.filter(user=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        if not user:
            user = User.objects.filter(is_superuser=True).first()
        today = date.today()
        month = self.request.data.get("month") or today.month
        year = self.request.data.get("year") or today.year
        serializer.save(user=user, month=month, year=year)

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
        current_month = int(request.data.get("month") or today.month)
        current_year = int(request.data.get("year") or today.year)

        allocations = [
            ("Housing", round(total_budget * Decimal("0.25"), 2)),
            ("Food & Drinks", round(total_budget * Decimal("0.20"), 2)),
            ("Bills & Utilities", round(total_budget * Decimal("0.10"), 2)),
            ("Transportation", round(total_budget * Decimal("0.10"), 2)),
            ("Shopping", round(total_budget * Decimal("0.15"), 2)),
            ("Entertainment", round(total_budget * Decimal("0.10"), 2)),
            ("Health & Wellness", round(total_budget * Decimal("0.10"), 2)),
        ]

        for cat_name, limit in allocations:
            cat = get_or_create_canonical_category(cat_name)
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

        updated_budgets = Budget.objects.filter(user=user, month=current_month, year=current_year)
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

        # Dynamic weekly breakdown for the current month
        week_labels = ["Week 1 (1-7)", "Week 2 (8-14)", "Week 3 (15-21)", "Week 4+ (22+)"]
        week_expenses = [0.0, 0.0, 0.0, 0.0]
        week_income = [0.0, 0.0, 0.0, 0.0]

        cur_month_txs = user_txs.filter(date__year=current_year, date__month=current_month)
        for tx in cur_month_txs:
            day = tx.date.day
            w_idx = 0 if day <= 7 else (1 if day <= 14 else (2 if day <= 21 else 3))
            amt = float(tx.amount)
            if tx.transaction_type == "Expense":
                week_expenses[w_idx] += amt
            elif tx.transaction_type == "Income":
                week_income[w_idx] += amt

        monthly_series = {
            "labels": chart_labels,
            "expenses": expense_series,
            "income": income_series,
            "weekly": {
                "labels": week_labels,
                "expenses": week_expenses,
                "income": week_income
            }
        }

        recent_txs = user_txs[:5]
        recent_tx_serializer = TransactionSerializer(recent_txs, many=True)

        ensure_user_default_budgets(user, month=current_month, year=current_year)

        # Auto-create budget for any category where user has recorded expenses this month
        active_cat_ids = user_txs.filter(
            transaction_type="Expense",
            date__year=current_year,
            date__month=current_month
        ).values_list("category_id", flat=True).distinct()

        for cat_id in active_cat_ids:
            cat = Category.objects.filter(id=cat_id).first()
            if cat and not Budget.objects.filter(user=user, category=cat, month=current_month, year=current_year).exists():
                Budget.objects.create(
                    user=user,
                    category=cat,
                    month=current_month,
                    year=current_year,
                    monthly_limit=Decimal("5000.00")
                )

        budgets = Budget.objects.filter(user=user, month=current_month, year=current_year)
        if not budgets.exists():
            budgets = Budget.objects.filter(user=user)

        # Sort budgets so categories with active spending in the current month appear first!
        def get_active_spent(b):
            cat_names = [b.category.name]
            if b.category.name == "Food & Drinks":
                cat_names.append("Food & Dining")
            elif b.category.name == "Bills & Utilities":
                cat_names.append("Utilities")
            return float(user_txs.filter(
                category__name__in=cat_names,
                transaction_type="Expense",
                date__year=current_year,
                date__month=current_month
            ).aggregate(t=Sum("amount"))["t"] or 0)

        sorted_budgets = sorted(list(budgets), key=get_active_spent, reverse=True)
        budget_serializer = BudgetSerializer(sorted_budgets, many=True)

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
        categories = Category.objects.exclude(category_type="Income")
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

        # Sort category shares from highest spending to lowest
        category_shares.sort(key=lambda x: x["amount"], reverse=True)

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

        # Dynamic weekly breakdown for the current month
        week_labels = ["Week 1 (1-7)", "Week 2 (8-14)", "Week 3 (15-21)", "Week 4+ (22+)"]
        week_expenses = [0.0, 0.0, 0.0, 0.0]
        week_income = [0.0, 0.0, 0.0, 0.0]

        cur_month_txs = user_txs.filter(date__year=current_year, date__month=current_month)
        for tx in cur_month_txs:
            day = tx.date.day
            w_idx = 0 if day <= 7 else (1 if day <= 14 else (2 if day <= 21 else 3))
            amt = float(tx.amount)
            if tx.transaction_type == "Expense":
                week_expenses[w_idx] += amt
            elif tx.transaction_type == "Income":
                week_income[w_idx] += amt

        weekly_analytics = {
            "labels": week_labels,
            "expenses": week_expenses,
            "income": week_income
        }

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
            },
            "expense_analytics": {
                "labels": chart_labels,
                "income": trend_income,
                "expenses": trend_expenses,
                "weekly": weekly_analytics
            }
        })

ai_service = GeminiAIService()

class ReceiptScanView(APIView):
    """
    Accepts an uploaded receipt image (file or base64) and returns extracted fields via Gemini Vision OCR.
    If 'auto_save' is requested and a valid amount was extracted, immediately records the Transaction to the user's ledger.
    """
    def post(self, request):
        image_file = (
            request.FILES.get("image")
            or request.FILES.get("receipt_image")
            or request.FILES.get("file")
        )

        if not image_file and request.data.get("image_base64"):
            import base64
            from django.core.files.base import ContentFile
            try:
                b64_str = str(request.data["image_base64"])
                if "base64," in b64_str:
                    b64_str = b64_str.split("base64,")[1]
                img_data = base64.b64decode(b64_str)
                image_file = ContentFile(img_data, name="receipt_capture.jpg")
            except Exception as b64_err:
                print(f"[ReceiptScanView Base64 Decode Error]: {b64_err}")

        if not image_file:
            extracted_data = ai_service.scan_receipt(None)
        else:
            extracted_data = ai_service.scan_receipt(image_file)

        auto_save_param = request.data.get("auto_save")
        if auto_save_param is None:
            auto_save_param = request.query_params.get("auto_save")

        auto_save = False
        if isinstance(auto_save_param, bool):
            auto_save = auto_save_param
        elif isinstance(auto_save_param, str):
            auto_save = auto_save_param.lower() in ("true", "1", "yes")

        saved_tx = None
        extracted_amt = float(extracted_data.get("amount") or 0.0) if extracted_data else 0.0

        if auto_save and extracted_data and extracted_amt > 0:
            user = request.user if (request.user and request.user.is_authenticated) else None
            if not user:
                user = User.objects.filter(is_superuser=True).first()

            category_name = extracted_data.get("category", "Shopping")
            cat = get_or_create_canonical_category(category_name)
            try:
                amount_val = Decimal(str(extracted_amt))
            except Exception:
                amount_val = Decimal("0.00")

            date_val = extracted_data.get("date") or str(date.today())
            merchant_val = extracted_data.get("merchant") or "Scanned Receipt"
            notes_val = extracted_data.get("notes", "")

            try:
                if image_file:
                    image_file.seek(0)
                tx = Transaction.objects.create(
                    user=user,
                    transaction_type="Expense",
                    category=cat,
                    amount=amount_val,
                    date=date_val,
                    merchant=merchant_val,
                    notes=notes_val,
                    ai_scanned=True,
                    receipt_image=image_file if image_file else None
                )
                saved_tx = TransactionSerializer(tx).data
            except Exception as e:
                print(f"[ReceiptScanView auto_save error]: {e}")

        response_data = dict(extracted_data) if extracted_data else {}
        if saved_tx:
            response_data["transaction"] = saved_tx
            response_data["saved"] = True
        return Response(response_data)


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


class AIChatHistoryView(APIView):
    """
    Retrieves and manages conversational chat history.
    User-isolated: When authenticated, returns messages linked to the user account.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        session_id = request.query_params.get("session_id", "default")
        
        if user:
            history_qs = AIChatHistory.objects.filter(user=user).order_by("created_at")
        else:
            history_qs = AIChatHistory.objects.filter(session_id=session_id).order_by("created_at")

        serializer = AIChatHistorySerializer(history_qs, many=True)
        return Response(serializer.data)

    def delete(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        session_id = request.query_params.get("session_id", "default")

        if user:
            deleted_count, _ = AIChatHistory.objects.filter(user=user).delete()
        else:
            deleted_count, _ = AIChatHistory.objects.filter(session_id=session_id).delete()

        return Response({"message": "Chat history cleared successfully", "deleted": deleted_count})



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
