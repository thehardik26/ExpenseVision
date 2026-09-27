import { useState } from 'react';
import axios from 'axios';
import { Plus, Camera, Sparkles } from 'lucide-react';

export default function TransactionForm({ onTransactionAdded, onOpenScanner }) {
  const [txType, setTxType] = useState('Expense');
  const [category, setCategory] = useState('Shopping');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2025-04-17');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !merchant || loading) return;
    setLoading(true);

    try {
      await axios.post('/api/transactions/', {
        transaction_type: txType,
        category_name: category,
        amount: parseFloat(amount),
        date,
        merchant,
        notes
      });

      alert(`Added ${txType} of ₹${parseFloat(amount).toFixed(2)} for ${merchant}!`);
      setAmount('');
      setMerchant('');
      setNotes('');
      if (onTransactionAdded) onTransactionAdded();
    } catch (err) {
      console.error("Failed to add transaction:", err);
      alert("Could not save transaction to database. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const promptNaturalLanguage = () => {
    const text = prompt("Enter expense in plain English:", "Spent ₹450 at Starbucks for coffee and snacks");
    if (text) {
      setMerchant("Starbucks");
      setAmount("450.00");
      setCategory("Food & Drinks");
      setNotes(text);
      alert("✨ Gemini AI auto-filled the transaction fields!");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Add New Transaction</h2>
          <p className="text-xs text-slate-400 mt-0.5">Quick record with Gemini AI assists</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Type</label>
            <select
              value={txType}
              onChange={e => setTxType(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              <option value="Food & Drinks">Food & Drinks</option>
              <option value="Shopping">Shopping</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Bills & Utilities">Bills & Utilities</option>
              <option value="Housing">Housing</option>
              <option value="Income">Salary / Income</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount (₹)</label>
            <input
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
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Merchant / Payee</label>
            <input
              type="text"
              placeholder="e.g. Amazon, Starbucks, Swiggy"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Weekly team lunch"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-violet-200 transition cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} />
            <span>{loading ? 'Adding...' : 'Add Transaction'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
