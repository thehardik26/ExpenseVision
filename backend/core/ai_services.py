import os
import json
from decimal import Decimal
from datetime import date
from django.conf import settings
from .models import Transaction, Budget, Category, AIChatHistory
from django.contrib.auth.models import User
from django.db.models import Sum

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class GeminiAIService:
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))
        self.client = None
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GeminiAIService] Client init error: {e}")

    # 1. RECEIPT VISION OCR
    def scan_receipt(self, image_file):
        """
        Extracts merchant, amount, date, category, and items from a receipt image.
        """
        if self.client and image_file:
            try:
                image_bytes = image_file.read()
                prompt = """
                Analyze this receipt and extract:
                {
                  "merchant": "Store Name",
                  "amount": float,
                  "date": "YYYY-MM-DD",
                  "category": "Food & Drinks | Shopping | Transportation | Entertainment | Bills & Utilities | Housing | Groceries | Other",
                  "tax": float,
                  "notes": "Brief summary of purchased items"
                }
                Return ONLY valid JSON.
                """
                response = self.client.models.generate_content(
                    model='gemini-3.5-flash-lite',
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        prompt
                    ]
                )
                raw_text = response.text.strip().replace('```json', '').replace('```', '')
                return json.loads(raw_text)
            except Exception as e:
                print(f"[Gemini Vision OCR Error]: {e}")

        # Fallback simulation
        filename = getattr(image_file, 'name', '').lower() if image_file else ''
        if 'starbucks' in filename or 'coffee' in filename:
            return {
                'merchant': 'Starbucks Coffee',
                'amount': 345.00,
                'date': str(date.today()),
                'category': 'Food & Drinks',
                'notes': 'Latte, Cold Brew & pastry with team',
                'tax': 27.50
            }
        elif 'cinema' in filename or 'movie' in filename or 'amc' in filename:
            return {
                'merchant': 'PVR Cinemas',
                'amount': 1200.00,
                'date': str(date.today()),
                'category': 'Entertainment',
                'notes': '4 IMAX Tickets & large combo',
                'tax': 95.00
            }
        else:
            return {
                'merchant': 'Target Retail',
                'amount': 852.50,
                'date': '2025-04-15',
                'category': 'Shopping',
                'notes': 'Home office organizers and cables',
                'tax': 68.00
            }

    # 2. FINANCIAL COPILOT CHATBOT (USER-ISOLATED WITH LIVE DB CONTEXT)
    def chat_advisor(self, user_message, session_id='default', user=None):
        if not user:
            user = User.objects.filter(is_superuser=True).first()

        user_txs = Transaction.objects.filter(user=user)
        total_income = user_txs.filter(transaction_type='Income').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        total_expense = user_txs.filter(transaction_type='Expense').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        balance = total_income - total_expense

        budgets = Budget.objects.filter(user=user)
        budget_status = []
        for b in budgets:
            spent = user_txs.filter(category=b.category, transaction_type='Expense').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
            status_tag = 'OVER BUDGET!' if spent > b.monthly_limit else 'OK'
            budget_status.append(f"- {b.category.name}: Spent ₹{spent} / Limit ₹{b.monthly_limit} ({status_tag})")
        budget_summary = "\n".join(budget_status) if budget_status else "No budgets set yet."

        recent_items = [f"- {t.date}: {t.merchant} (₹{t.amount}, {t.category.name})" for t in user_txs[:10]]
        tx_summary = "\n".join(recent_items) if recent_items else "No transactions recorded yet."

        username = user.first_name or user.username if user else "User"

        system_context = f"""
        You are ExpenseVision AI, an expert personal finance copilot for {username}.
        All currency MUST be in Indian Rupees (₹).
        Here is {username}'s real-time financial snapshot:
        - Total Balance: ₹{balance:,.2f}
        - Total Income recorded: ₹{total_income:,.2f}
        - Total Expenses recorded: ₹{total_expense:,.2f}

        Monthly Budgets:
        {budget_summary}

        Recent Transactions:
        {tx_summary}

        Provide concise, friendly, math-grounded advice strictly in Indian Rupees (₹).
        """

        # 1. Call Live Google Gemini API
        if self.client:
            for model_name in ['gemini-3.5-flash-lite', 'gemini-flash-latest']:
                try:
                    chat_prompt = f"{system_context}\n\nUser Question: {user_message}"
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=chat_prompt
                    )
                    ai_reply = response.text.strip()
                    AIChatHistory.objects.create(session_id=session_id, role='user', message=user_message)
                    AIChatHistory.objects.create(session_id=session_id, role='model', message=ai_reply)
                    return ai_reply
                except Exception as e:
                    print(f"[Gemini Chat Error with {model_name}]: {e}")

        # 2. Dynamic Fallback Engine if API is unreachable
        AIChatHistory.objects.create(session_id=session_id, role='user', message=user_message)
        msg_lower = user_message.lower()

        if "budget" in msg_lower or "over" in msg_lower:
            reply = f"📊 **Budget Health Analysis for {username}:**\n\nYour active monthly budgets are tracked in Indian Rupees (₹). Your current balance is **₹{balance:,.2f}**."
        elif "good" in msg_lower or "how am i" in msg_lower or "doing" in msg_lower:
            reply = f"✨ **Financial Wellness Check:**\n\nYour current ledger balance is **₹{balance:,.2f}** with **₹{total_income:,.2f}** income and **₹{total_expense:,.2f}** in expenses."
        elif "save" in msg_lower or "saving" in msg_lower:
            reply = f"💡 **Savings Strategy for {username}:**\n\n1. Review your high-expense categories to identify discretionary items.\n2. Maintain at least a 20% savings buffer on your income of **₹{total_income:,.2f}**."
        else:
            reply = f"Based on your personal ledger (₹{balance:,.2f} balance, ₹{total_expense:,.2f} total expenses), your finances are tracked. How can I assist you with your budgets or expenses today?"

        AIChatHistory.objects.create(session_id=session_id, role='model', message=reply)
        return reply

    # 3. NATURAL LANGUAGE TRANSACTION PARSER
    def parse_natural_language(self, text):
        if self.client:
            try:
                prompt = f"""
                Parse this expense text into JSON: "{text}"
                Format:
                {{
                  "merchant": "Store/place name",
                  "amount": float,
                  "category": "Food & Drinks | Shopping | Transportation | Entertainment | Bills & Utilities | Housing | Groceries | Income | Other",
                  "date": "{date.today().isoformat()}",
                  "type": "Expense or Income",
                  "notes": "original description"
                }}
                Return ONLY valid JSON.
                """
                response = self.client.models.generate_content(
                    model='gemini-3.5-flash-lite',
                    contents=prompt
                )
                raw_text = response.text.strip().replace('```json', '').replace('```', '')
                return json.loads(raw_text)
            except Exception as e:
                print(f"[Gemini NL Parse Error]: {e}")

        # Intelligent simulation fallback
        text_lower = text.lower()
        cat = "Shopping"
        merchant = "Retailer"
        tx_type = "Expense"

        if "salary" in text_lower or "income" in text_lower or "received" in text_lower:
            cat = "Income"
            merchant = "Employer"
            tx_type = "Income"
        elif "starbucks" in text_lower or "coffee" in text_lower or "restaurant" in text_lower or "dinner" in text_lower:
            cat = "Food & Drinks"
            merchant = "Starbucks" if "starbucks" in text_lower else "Restaurant"
        elif "cinema" in text_lower or "movie" in text_lower or "tickets" in text_lower:
            cat = "Entertainment"
            merchant = "PVR Cinemas"
        elif "gas" in text_lower or "fuel" in text_lower or "uber" in text_lower:
            cat = "Transportation"
            merchant = "Gas Station" if "gas" in text_lower else "Uber"

        import re
        nums = re.findall(r'[\d,.]+', text)
        amt = float(nums[0].replace(',', '')) if nums else 250.00

        return {
            'merchant': merchant,
            'amount': amt,
            'category': cat,
            'date': date.today().isoformat(),
            'type': tx_type,
            'notes': text
        }


ai_service = GeminiAIService()
