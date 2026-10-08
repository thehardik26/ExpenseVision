import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatINR = (val) => {
  const num = Number(val || 0);
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
};

export default function BudgetOverview({ budgets = [] }) {
  const totalLimit = budgets.reduce((acc, b) => acc + parseFloat(b.monthly_limit || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + parseFloat(b.spent || 0), 0);

  const sortedBudgets = [...budgets].sort((a, b) => {
    const aSpent = parseFloat(a.spent || 0);
    const bSpent = parseFloat(b.spent || 0);
    if (bSpent !== aSpent) return bSpent - aSpent;
    return a.category_name.localeCompare(b.category_name);
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">Budget Overview</h2>
          <span className="text-[11px] text-slate-400">Total Monthly: {formatINR(totalLimit)}</span>
        </div>
        <Link to="/budgets" className="text-xs font-bold text-violet-600 hover:text-violet-700">
          Manage All &rarr;
        </Link>
      </div>

      <div className="space-y-4 my-2 max-h-[320px] overflow-y-auto pr-1">
        {sortedBudgets.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">No active budgets for this month.</div>
        ) : (
          sortedBudgets.map(b => (
            <div key={b.id} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span>{b.category_name}</span>
                  {parseFloat(b.spent || 0) > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" title="Active spending" />
                  )}
                </span>
                <span className={`flex items-center gap-1 ${b.is_over_budget ? 'text-rose-500 font-extrabold' : 'text-slate-500'}`}>
                  {formatINR(b.spent)} / {formatINR(b.monthly_limit)}
                  {b.is_over_budget && <AlertCircle size={14} className="text-rose-500" />}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    b.is_over_budget ? 'bg-rose-500' : (b.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500')
                  }`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Overall Spent: <strong className="text-slate-800">{formatINR(totalSpent)}</strong></span>
        <span>Remaining: <strong className="text-emerald-600">{formatINR(Math.max(0, totalLimit - totalSpent))}</strong></span>
      </div>
    </div>
  );
}
