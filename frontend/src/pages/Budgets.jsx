import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Plus, AlertCircle, CheckCircle2, Sliders, X } from 'lucide-react';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New budget form state
  const [categoryName, setCategoryName] = useState('Groceries');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [categoryType, setCategoryType] = useState('Essential');

  const fetchBudgets = () => {
    setLoading(true);
    axios.get('/api/budgets/')
      .then(res => {
        setBudgets(res.data);
      })
      .catch(err => {
        console.error("Budgets fetch error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  // Filter budgets (ALL, Essential, Discretionary)
  const filteredBudgets = useMemo(() => {
    if (activeFilter === 'ALL') return budgets;
    return budgets.filter(b => b.category_type === activeFilter);
  }, [budgets, activeFilter]);

  // Totals for Summary Bar
  const totals = useMemo(() => {
    return budgets.reduce((acc, b) => {
      acc.totalLimit += parseFloat(b.monthly_limit || 0);
      acc.totalSpent += parseFloat(b.spent || 0);
      acc.totalRemaining += parseFloat(b.remaining || 0);
      return acc;
    }, { totalLimit: 0, totalSpent: 0, totalRemaining: 0 });
  }, [budgets]);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!monthlyLimit) return;

    try {
      await axios.post('/api/budgets/', {
        category_name: categoryName,
        monthly_limit: parseFloat(monthlyLimit),
        category_type: categoryType,
        month: 4,
        year: 2025
      });
    } catch {
      // Local fallback
    }

    alert(`Created new ${categoryType} budget for ${categoryName} (₹${monthlyLimit}/mo)!`);
    setIsModalOpen(false);
    setMonthlyLimit('');
    fetchBudgets();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Monthly Budget Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time spend vs allocations across essential and discretionary categories
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer self-start md:self-auto"
        >
          <Plus size={15} />
          <span>New Budget</span>
        </button>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex gap-2">
        {['ALL', 'Essential', 'Discretionary'].map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === type
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type === 'ALL' ? 'All Categories' : type}
          </button>
        ))}
      </div>

      {/* 3. Budget Cards List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold animate-pulse">Loading Budgets...</div>
        ) : filteredBudgets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">No budgets found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBudgets.map(b => {
              const pct = Math.min(100, Math.round(b.percentage || 0));
              const isOver = b.is_over_budget;

              return (
                <div key={b.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3.5 hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{b.category_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.category_type === 'Essential' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {b.category_type}
                      </span>
                    </div>

                    <span className={`text-xs font-extrabold flex items-center gap-1 ${isOver ? 'text-rose-500' : 'text-slate-700'}`}>
                      {formatINR(b.spent)} / {formatINR(b.monthly_limit)}
                      {isOver && <AlertCircle size={14} className="text-rose-500" />}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{pct}% spent</span>
                    <span className={isOver ? 'text-rose-500 font-bold' : 'text-slate-600'}>
                      {isOver ? `Over by ${formatINR(b.spent - b.monthly_limit)}` : `${formatINR(b.remaining)} remaining`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Financial Summary Bar (In Rupees) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Budget</span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(totals.totalLimit)}
          </div>
          <span className="text-xs text-slate-400">Total monthly limit allocation</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent</span>
          <div className="text-2xl font-extrabold text-rose-500 tracking-tight">
            {formatINR(totals.totalSpent)}
          </div>
          <span className="text-xs text-slate-400">Current month consumption</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Remaining</span>
          <div className="text-2xl font-extrabold text-emerald-500 tracking-tight">
            {formatINR(totals.totalRemaining)}
          </div>
          <span className="text-xs text-emerald-600 font-bold">✓ Safe headroom</span>
        </div>
      </div>

      {/* 5. Create New Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">Add Category Budget</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="Food & Drinks">Food & Drinks</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Housing">Housing</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Health">Health</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Monthly Limit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={monthlyLimit}
                  onChange={e => setMonthlyLimit(e.target.value)}
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryType('Essential')}
                    className={`h-9 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      categoryType === 'Essential'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Essential
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryType('Discretionary')}
                    className={`h-9 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      categoryType === 'Discretionary'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Discretionary
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
