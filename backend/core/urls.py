from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, TransactionViewSet, BudgetViewSet,
    DashboardSummaryView, ReportsAnalyticsView,
    ReceiptScanView, AIChatView, AIChatHistoryView, NaturalLanguageParseView
)

from .auth_views import (
    LoginView, RegisterView, LogoutView, CurrentUserView,
    PasswordResetRequestView, PasswordResetConfirmView
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"budgets", BudgetViewSet, basename="budget")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("reports/", ReportsAnalyticsView.as_view(), name="reports-analytics"),
    path("ai/scan-receipt/", ReceiptScanView.as_view(), name="ai-scan-receipt"),
    path("ai/chat/", AIChatView.as_view(), name="ai-chat"),
    path("ai/chat/history/", AIChatHistoryView.as_view(), name="ai-chat-history"),
    path("ai/parse-transaction/", NaturalLanguageParseView.as_view(), name="ai-parse-transaction"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("auth/password-reset-confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", CurrentUserView.as_view(), name="auth-me"),
]
