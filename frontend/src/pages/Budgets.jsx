import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Plus, AlertCircle, CheckCircle2, Sliders, X, Sparkles, Edit2, Zap } from 'lucide-react';

const formatINR = (val) => {
  const num = Number(val || 0);
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
};

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTotalBudgetModalOpen, setIsTotalBudgetModalOpen] = useState(false);

  // Total budget form state
  const [totalMonthlyBudgetInput, setTotalMonthlyBudgetInput] = useState('50000');
  const [submittingTotal, setSubmittingTotal] = useState(false);

  // Category budget form state
  const [editingBudgetId, setEditingBudgetId] = useState(null);
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

  // Overall Totals
  const totals = useMemo(() => {
    return budgets.reduce((acc, b) => {
      acc.totalLimit += parseFloat(b.monthly_limit || 0);
      acc.totalSpent += parseFloat(b.spent || 0);
      acc.totalRemaining += parseFloat(b.remaining || 0);
      return acc;
    }, { totalLimit: 0, totalSpent: 0, totalRemaining: 0 });
  }, [budgets]);

  // Handler for setting overall total monthly budget
  const handleSetTotalBudget = async (e) => {
    e.preventDefault();
    if (!totalMonthlyBudgetInput) return;
    setSubmittingTotal(true);

    try {
      const res = await axios.post('/api/budgets/set-total/', {
        total_budget: parseFloat(totalMonthlyBudgetInput)
      });
      if (res.data?.budgets) {
        setBudgets(res.data.budgets);
      }
      setIsTotalBudgetModalOpen(false);
      fetchBudgets();
    } catch (err) {
      console.error('Error setting total budget:', err);
    } finally {
      setSubmittingTotal(false);
    }
  };

  // Handler for creating or editing an individual category budget
  const handleSaveCategoryBudget = async (e) => {
    e.preventDefault();
    if (!monthlyLimit) return;

    try {
      if (editingBudgetId) {
        await axios.patch(`/api/budgets/${editingBudgetId}/`, {
          monthly_limit: parseFloat(monthlyLimit),
          category_type: categoryType
        });
      } else {
        await axios.post('/api/budgets/', {
          category_name: categoryName,
          monthly_limit: parseFloat(monthlyLimit),
          category_type: categoryType,
          month: 4,
          year: 2025
        });
      }
    } catch (err) {
      console.error('Error saving budget:', err);
    }

    setIsCategoryModalOpen(false);
    setEditingBudgetId(null);
    setMonthlyLimit('');
    fetchBudgets();
  };

  const openEditModal = (budget) => {
    setEditingBudgetId(budget.id);
    setCategoryName(budget.category_name);
    setMonthlyLimit(budget.monthly_limit);
    setCategoryType(budget.category_type || 'Essential');
    setIsCategoryModalOpen(true);
  };

  // Proportional breakdown preview for the total budget modal
  const targetTotal = parseFloat(totalMonthlyBudgetInput || 0);
  const previewAllocations = useMemo(() => [
    { name: 'Housing (25%)', amount: targetTotal * 0.25, type: 'Essential', color: 'bg-blue-500' },
    { name: 'Food & Dining (20%)', amount: targetTotal * 0.20, type: 'Essential', color: 'bg-emerald-500' },
    { name: 'Shopping (15%)', amount: targetTotal * 0.15, type: 'Discretionary', color: 'bg-amber-500' },
    { name: 'Utilities (10%)', amount: targetTotal * 0.10, type: 'Essential', color: 'bg-cyan-500' },
    { name: 'Transportation (10%)', amount: targetTotal * 0.10, type: 'Essential', color: 'bg-indigo-500' },
    { name: 'Health (10%)', amount: targetTotal * 0.10, type: 'Essential', color: 'bg-teal-500' },
    { name: 'Entertainment (10%)', amount: targetTotal * 0.10, type: 'Discretionary', color: 'bg-pink-500' },
  ], [targetTotal]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Monthly Budgets</h2>
            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              April 2025
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Set an overall monthly target or customize individual category limits in Indian Rupees (₹).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main Action: Set Total Monthly Budget */}
          <button
            onClick={() => setIsTotalBudgetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer"
          >
            <Zap size={15} className="text-amber-300" />
            <span>Set Total Monthly Budget</span>
          </button>

          {/* Secondary Action: Add Individual Category */}
          <button
            onClick={() => {
              setEditingBudgetId(null);
              setCategoryName('Groceries');
              setMonthlyLimit('');
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* 2. Top Financial Summary Bar (In Rupees) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Budget</span>
            <button
              onClick={() => setIsTotalBudgetModalOpen(true)}
              className="text-[11px] font-bold text-violet-600 hover:underline cursor-pointer"
            >
              Change Target
            </button>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {formatINR(totals.totalLimit)}
          </div>
          <span className="text-[11px] text-slate-400">Sum of all active category allocations</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent This Month</span>
          <div className="text-3xl font-black text-rose-500 tracking-tight">
            {formatINR(totals.totalSpent)}
          </div>
          <span className="text-[11px] text-slate-400">
            {totals.totalLimit > 0 ? `${Math.round((totals.totalSpent / totals.totalLimit) * 100)}% of total budget consumed` : 'No spending recorded'}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Remaining</span>
          <div className="text-3xl font-black text-emerald-500 tracking-tight">
            {formatINR(totals.totalRemaining)}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">
            ✓ Available cash headroom
          </span>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit text-xs font-bold">
          {['ALL', 'Essential', 'Discretionary'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                activeFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'ALL' ? 'All Categories' : tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {filteredBudgets.length} categories active
        </span>
      </div>

      {/* 4. Category Budget Cards Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold animate-pulse">Loading budgets...</div>
        ) : filteredBudgets.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Sliders size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No category budgets found</p>
            <p className="text-xs text-slate-400">Click "Set Total Monthly Budget" to automatically generate budgets for this month.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBudgets.map(b => {
              const pct = Math.min(100, Math.round(b.percentage || 0));
              const isOver = b.is_over_budget;

              return (
                <div key={b.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3.5 hover:shadow-md hover:border-violet-100 transition group">
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

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold flex items-center gap-1 ${isOver ? 'text-rose-500' : 'text-slate-700'}`}>
                        {formatINR(b.spent)} / {formatINR(b.monthly_limit)}
                        {isOver && <AlertCircle size={14} className="text-rose-500" />}
                      </span>
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition cursor-pointer opacity-70 group-hover:opacity-100"
                        title="Edit Limit"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
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

      {/* 5. Set Overall Total Monthly Budget Modal */}
      {isTotalBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Set Total Monthly Budget</h3>
                  <p className="text-[11px] text-slate-400">Allocates your monthly limit across categories using 50/30/20 financial rules</p>
                </div>
              </div>
              <button onClick={() => setIsTotalBudgetModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSetTotalBudget} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Overall Monthly Target (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={totalMonthlyBudgetInput}
                  onChange={e => setTotalMonthlyBudgetInput(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              {/* Quick Select Presets */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                {['25000', '50000', '75000', '100000'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTotalMonthlyBudgetInput(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      totalMonthlyBudgetInput === val
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{(parseInt(val) / 1000)}k
                  </button>
                ))}
              </div>

              {/* Live Preview Allocations */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Category Distribution Preview</span>
                  <span className="text-violet-600">{formatINR(targetTotal)}</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {previewAllocations.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-[11px] py-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="font-semibold text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTotalBudgetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTotal}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{submittingTotal ? 'Applying...' : 'Apply Total Budget'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add / Edit Individual Category Budget Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingBudgetId ? 'Edit Category Budget' : 'Add Category Budget'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryBudget} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  disabled={!!editingBudgetId}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:bg-slate-100"
                >
                  <option value="Food & Drinks">Food & Drinks</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Housing">Housing</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Health & Wellness">Health & Wellness</option>
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
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer"
                >
                  {editingBudgetId ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
