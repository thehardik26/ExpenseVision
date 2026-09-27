import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BudgetOverview({ budgets = [] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">Budget Overview</h2>
        <Link to="/budgets" className="text-xs font-bold text-violet-600 hover:text-violet-700">
          View All &rarr;
        </Link>
      </div>

      <div className="space-y-4">
        {budgets.slice(0, 5).map(b => (
          <div key={b.id} className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-800">{b.category_name}</span>
              <span className={`flex items-center gap-1 ${b.is_over_budget ? 'text-rose-500 font-extrabold' : 'text-slate-500'}`}>
                ₹{b.spent} / ₹{b.monthly_limit}
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
        ))}
      </div>
    </div>
  );
}
