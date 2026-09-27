import { useEffect, useState } from 'react';
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
  return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
};

export default function Dashboard() {
  const { onOpenScanner } = useOutletContext();
  const [data, setData] = useState(null);

  const fetchData = () => {
    axios.get('/api/dashboard/')
      .then(res => setData(res.data))
      .catch(err => console.error("Dashboard API error:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) {
    return <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">Loading ExpenseVision Dashboard...</div>;
  }

  const isBalancePositive = data.kpis.total_balance >= 0;
  const isSavingsPositive = data.kpis.savings >= 0;

  return (
    <div className="space-y-8">
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
          delta={data.kpis.income_delta} 
          isPositive={true} 
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
      <TransactionForm onTransactionAdded={fetchData} onOpenScanner={onOpenScanner} />

      {/* Recent Transactions Table */}
      <RecentTransactions transactions={data.recent_transactions} />
    </div>
  );
}
