import { useEffect, useState } from 'react';
import axios from 'axios';
import ExpenseChart from '../components/ExpenseChart';
import CategoryDonutChart from '../components/CategoryDonutChart';
import TrendLineChart from '../components/TrendLineChart';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Reports() {
  const [analytics, setAnalytics] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    expenses: [12000, 14000, 11500, 16000, 13500, 15000],
    income: [34000, 35000, 36000, 37000, 40000, 43500]
  });

  useEffect(() => {
    axios.get('/api/dashboard/')
      .then(res => {
        if (res.data?.expense_analytics) {
          setAnalytics(res.data.expense_analytics);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* 1. 6-Month Expense & Income Velocity */}
      <ExpenseChart analytics={analytics} />

      {/* 2. Donut Breakdown & Trend Line Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDonutChart />
        <TrendLineChart />
      </div>

      {/* 3. Financial Summary Bar (In Rupees) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(225500)}
          </div>
          <span className="text-xs text-slate-400">Last 6 months cumulative</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
          <div className="text-2xl font-extrabold text-rose-500 tracking-tight">
            {formatINR(82000)}
          </div>
          <span className="text-xs text-slate-400">Last 6 months cumulative</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Savings</span>
          <div className="text-2xl font-extrabold text-violet-600 tracking-tight">
            {formatINR(143500)}
          </div>
          <span className="text-xs text-emerald-500 font-bold">↗ 63.6% Savings rate</span>
        </div>
      </div>
    </div>
  );
}
