import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import ExpenseChart from '../components/ExpenseChart';
import CategoryDonutChart from '../components/CategoryDonutChart';
import TrendLineChart from '../components/TrendLineChart';
import { ArrowUpRight, ArrowDownRight, PiggyBank, RefreshCw } from 'lucide-react';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await axios.get('/api/reports/');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch reports analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();

    const handleTransactionAdded = () => {
      fetchReports(true);
    };

    window.addEventListener('transactionAdded', handleTransactionAdded);
    return () => {
      window.removeEventListener('transactionAdded', handleTransactionAdded);
    };
  }, [fetchReports]);

  if (loading && !data) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Loading Financial Reports & Analytics...</span>
      </div>
    );
  }

  const summary = data?.six_month_summary || { total_income: 0, total_expenses: 0, net_savings: 0 };
  const totalIncome = summary.total_income || 0;
  const totalExpenses = summary.total_expenses || 0;
  const netSavings = summary.net_savings || 0;

  const savingsRate = totalIncome > 0
    ? ((netSavings / totalIncome) * 100).toFixed(1)
    : '0.0';

  const isPositiveSavings = netSavings >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="relative">
        {refreshing && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-slate-200 text-[10px] font-bold text-violet-600 shadow-xs animate-pulse">
            <RefreshCw size={11} className="animate-spin" />
            <span>Updating...</span>
          </div>
        )}
        <ExpenseChart analytics={data?.expense_analytics || { labels: data?.trend_line?.labels, expenses: data?.trend_line?.expenses, income: data?.trend_line?.income }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDonutChart categoryBreakdown={data?.category_breakdown || []} />
        <TrendLineChart trendLine={data?.trend_line} />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Income
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight size={15} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(totalIncome)}
          </div>
          <span className="text-xs text-slate-400">
            Last 6 months cumulative earnings
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight size={15} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-500 tracking-tight">
            {formatINR(totalExpenses)}
          </div>
          <span className="text-xs text-slate-400">
            Last 6 months cumulative spending
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Net Savings
            </span>
            <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <PiggyBank size={15} />
            </span>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${isPositiveSavings ? 'text-violet-600' : 'text-rose-600'}`}>
            {formatINR(netSavings)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className={isPositiveSavings ? 'text-emerald-500' : 'text-rose-500'}>
              {isPositiveSavings ? '↗' : '↘'} {savingsRate}% Savings rate
            </span>
            <span className="text-slate-400 font-normal">
              ({isPositiveSavings ? 'surplus retained' : 'deficit'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
