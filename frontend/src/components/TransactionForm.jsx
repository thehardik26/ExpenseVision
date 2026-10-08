import { useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { Plus, Camera, Sparkles, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

const TransactionForm = forwardRef(function TransactionForm({ onTransactionAdded, onOpenScanner }, ref) {
  const [txType, setTxType] = useState('Expense');
  const [category, setCategory] = useState('Food & Drinks');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useImperativeHandle(ref, () => ({
    prefillIncome: (defaultAmount = '', defaultSource = 'Monthly Salary') => {
      setTxType('Income');
      setCategory('Income');
      setMerchant(defaultSource);
      if (defaultAmount) setAmount(defaultAmount);
      setDate(getTodayDateStr());
      setTimeout(() => {
        const el = document.getElementById('tx-amount-input');
        if (el) el.focus();
      }, 100);
    }
  }));

  const handleTypeSelect = (type) => {
    setTxType(type);
    if (type === 'Income') {
      setCategory('Income');
      if (!merchant || merchant === 'Swiggy' || merchant === 'Amazon') {
        setMerchant('Monthly Salary');
      }
    } else {
      if (category === 'Income') {
        setCategory('Food & Drinks');
      }
      if (merchant === 'Monthly Salary') {
        setMerchant('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !merchant || loading) return;
    setLoading(true);
    setSuccessMsg('');

    try {
      await axios.post('/api/transactions/', {
        transaction_type: txType,
        category_name: category,
        amount: parseFloat(amount),
        date: date || getTodayDateStr(),
        merchant,
        notes
      });

      const formattedAmt = parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      setSuccessMsg(`Added ${txType} of ₹${formattedAmt} (${merchant})`);
      setAmount('');
      setMerchant('');
      setNotes('');
      setDate(getTodayDateStr());
      if (onTransactionAdded) onTransactionAdded();

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to add transaction:', err);
      alert('Could not save transaction to database. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const promptNaturalLanguage = () => {
    const text = prompt('Enter transaction in plain English:', 'Received ₹50,000 salary for September');
    if (text) {
      const lower = text.toLowerCase();
      if (lower.includes('salary') || lower.includes('income') || lower.includes('received') || lower.includes('earned')) {
        setTxType('Income');
        setCategory('Income');
        setMerchant('Monthly Salary');
      } else {
        setTxType('Expense');
        setCategory('Food & Drinks');
        setMerchant('Starbucks');
      }
      setAmount('50000.00');
      setNotes(text);
      setDate(getTodayDateStr());
    }
  };

  return (
    <div id="transaction-form-card" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Add New Transaction</h2>
            {successMsg && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={12} /> {successMsg}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Record expense or income with live real-time date</p>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Camera size={14} className="text-violet-600" />
            <span>Scan Receipt with Gemini</span>
          </button>
          <button
            type="button"
            onClick={promptNaturalLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Natural Language Entry</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Transaction Type</label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => handleTypeSelect('Expense')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                txType === 'Expense'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft size={16} className={txType === 'Expense' ? 'text-rose-600' : 'text-slate-400'} />
              <span>💸 Expense (Spent Money)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('Income')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                txType === 'Income'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs ring-1 ring-emerald-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight size={16} className={txType === 'Income' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>💰 Income (Salary / Earnings)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              {txType === 'Income' ? (
                <>
                  <option value="Income">Salary / Income</option>
                  <option value="Freelance">Freelance / Consulting</option>
                  <option value="Investments">Investments & Dividends</option>
                  <option value="Bonus">Bonus & Gifts</option>
                  <option value="Other Income">Other Income</option>
                </>
              ) : (
                <>
                  <option value="Food & Drinks">Food & Drinks</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Housing">Housing</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount (₹)</label>
            <input
              id="tx-amount-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600">Date</label>
              <button
                type="button"
                onClick={() => setDate(getTodayDateStr())}
                className="text-[10px] text-violet-600 font-bold hover:underline cursor-pointer"
              >
                Set Today
              </button>
            </div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              {txType === 'Income' ? 'Income Source / Employer' : 'Merchant / Payee'}
            </label>
            <input
              type="text"
              placeholder={txType === 'Income' ? 'e.g. Monthly Salary, Tech Corp, Client' : 'e.g. Swiggy, Amazon, Uber'}
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] text-slate-400 font-semibold">Quick fill:</span>
          {txType === 'Income' ? (
            <>
              {['Monthly Salary', 'Freelance Work', 'Bank Interest', 'Yearly Bonus'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setMerchant(chip)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/60 transition cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </>
          ) : (
            <>
              {['Swiggy', 'Zomato', 'Amazon', 'Starbucks', 'Electricity Bill'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setMerchant(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200/60 transition cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </>
          )}
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Notes (optional)</label>
          <input
            type="text"
            placeholder={txType === 'Income' ? 'e.g. Direct bank deposit' : 'e.g. Dinner with colleagues'}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 text-white ${
              txType === 'Income'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'
            }`}
          >
            <Plus size={16} />
            <span>{loading ? 'Adding...' : `Add ${txType}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
});

export default TransactionForm;
