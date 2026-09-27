# ExpenseVision 🪙📊

An AI-powered personal finance management and expense tracking web application built with **React (Vite + Tailwind CSS v4)** and **Django REST Framework**, powered by **Google Gemini 2.5 Flash** with live database context in **Indian Rupees (₹)**.

---

## ✨ Features

- **Personalized Financial Dashboard**:
  - Real-time KPI metrics for Total Balance, Monthly Income, Expenses, and Savings.
  - Interactive 6-month Income vs. Expense analytics bar chart.
  - Active budget progress trackers and recent transaction feeds.
- **Multi-User Private Ledger**:
  - Full per-user data isolation: each user has their own private ledger, separate budgets, and personalized dashboard.
  - Unified authentication connected to Django `auth.User` and Django Admin.
  - Support for Django Superusers with dedicated Django Admin access links.
- **AI Financial Copilot**:
  - Conversational AI advisor grounded in your live transaction history and monthly budgets.
  - Smart budget health analysis and personalized savings recommendations in Indian Rupees (₹).
- **AI Receipt Scanner (Vision OCR)**:
  - Extract merchant, amount, category, date, and tax directly from receipt photos using Gemini Vision.
- **Budget & Category Management**:
  - Set custom monthly spending thresholds across categories (Food, Shopping, Utilities, Transportation, etc.).
  - Real-time over-budget warnings and percentage utilization bars.
- **Detailed Financial Reports**:
  - Category expense distribution donut chart.
  - 6-month historical trend analysis and financial health metrics.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios, React Router v7
- **Backend**: Python 3, Django 6, Django REST Framework, DRF Token Authentication
- **AI / LLM**: Google Gemini API (`@google/genai`, `gemini-3.5-flash-lite`, `gemini-flash-latest`)
- **Database**: SQLite (Development)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Google Gemini API Key

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r ../requirement.txt
python manage.py migrate
python manage.py createsuperuser  # Optional: create admin account
python manage.py runserver
```

Create a `.env` file in `backend/.env`:
```env
SECRET_KEY=your_django_secret_key
DEBUG=True
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

* Frontend runs on `http://localhost:3000`
* Backend API runs on `http://127.0.0.1:8000`
* Django Admin available at `http://127.0.0.1:8000/admin/`

---

## 🔒 Security
- All sensitive API keys and secrets are loaded via environment variables (`.env`).
- Never commit `.env` or production credentials.
