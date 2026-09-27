import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import ExpenseChart from '../components/ExpenseChart';
import BudgetOverview from '../components/BudgetOverview';
import TransactionForm from '../components/TransactionForm';
import RecentTransactions from '../components/ReactTransactions';

const formatINR = (val) => {
  const num = Number(val || 0);
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (num < 0 ? '-₹' : '₹') + formatted;
};

export default function Dashboard() {
  const { onOpenScanner } = useOutletContext();
  const [data, setData] = useState(null);
  const [addingSalary, setAddingSalary] = useState(false);
  const txFormRef = useRef(null);

  const fetchData = () => {
    axios.get('/api/dashboard/')
      .then(res => setData(res.data))
      .catch(err => console.error("Dashboard API error:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAddSalary = async (amt = '50000') => {
    setAddingSalary(true);
    try {
      await axios.post('/api/transactions/', {
        transaction_type: 'Income',
        category_name: 'Income',
        amount: parseFloat(amt),
        date: new Date().toISOString().split('T')[0],
        merchant: 'Monthly Salary',
        notes: 'Monthly salary credit'
      });
      fetchData();
    } catch (err) {
      console.error("Failed to quick add salary:", err);
      if (txFormRef.current) {
        txFormRef.current.prefillIncome(amt, 'Monthly Salary');
        document.getElementById('transaction-form-card')?.scrollIntoView({ behavior: 'smooth' });
      }
    } finally {
      setAddingSalary(false);
    }
  };

  if (!data) {
    return <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">Loading ExpenseVision Dashboard...</div>;
  }

  const isBalancePositive = data.kpis.total_balance >= 0;
  const isSavingsPositive = data.kpis.savings >= 0;
  const hasZeroIncome = Number(data.kpis.income) === 0;

  return (
    <div className="space-y-6">
      {/* Informative Guidance Banner if Income is 0 */}
      {hasZeroIncome && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Why is Income ₹0.00 and Balance in Deficit?
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Quick Fix
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                You currently have 1 expense recorded (₹500.00 Swiggy) and no income transactions logged yet. <strong>Monthly Budgets</strong> set your spending targets, while your <strong>Total Balance</strong> is calculated from actual <em>Income minus Expenses</em>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              onClick={() => handleQuickAddSalary('50000')}
              disabled={addingSalary}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition cursor-pointer disabled:opacity-50"
            >
              <span>{addingSalary ? 'Adding...' : '⚡ + Add ₹50,000 Salary'}</span>
            </button>
            <button
              onClick={() => {
                if (txFormRef.current) {
                  txFormRef.current.prefillIncome('', 'Monthly Salary');
                  document.getElementById('transaction-form-card')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Custom Amount
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Balance" 
          value={formatINR(data.kpis.total_balance)} 
          delta={!isBalancePositive ? 'Deficit (Add income)' : data.kpis.balance_delta} 
          isPositive={isBalancePositive} 
        />
        <MetricCard 
          title="Income" 
          value={formatINR(data.kpis.income)} 
          delta={hasZeroIncome ? 'No income logged' : data.kpis.income_delta} 
          isPositive={!hasZeroIncome} 
          type="income" 
        />
        <MetricCard 
          title="Expenses" 
          value={formatINR(data.kpis.expenses)} 
          delta={data.kpis.expenses_delta} 
          isPositive={false} 
          type="expense" 
        />
        <MetricCard 
          title="Savings" 
          value={formatINR(data.kpis.savings)} 
          delta={!isSavingsPositive ? 'Net deficit' : data.kpis.savings_percent} 
          isPositive={isSavingsPositive} 
          type="savings" 
        />
      </div>

      {/* Analytics & Budget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseChart analytics={data.expense_analytics} />
        </div>
        <BudgetOverview budgets={data.budget_overview} />
      </div>

      {/* Transaction Entry Form */}
      <TransactionForm ref={txFormRef} onTransactionAdded={fetchData} onOpenScanner={onOpenScanner} />

      {/* Recent Transactions Table */}
      <RecentTransactions transactions={data.recent_transactions} />
    </div>
  );
}
