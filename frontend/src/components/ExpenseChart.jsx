import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function ExpenseChart({ analytics }) {
  const [timeframe, setTimeframe] = useState('monthly');

  const barData = {
    labels: timeframe === 'weekly' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] : analytics.labels,
    datasets: [
      {
        label: 'Expenses',
        data: timeframe === 'weekly' ? [3500, 4800, 3200, 3540] : analytics.expenses,
        backgroundColor: '#EF4444',
        borderRadius: 6
      },
      {
        label: 'Income',
        data: timeframe === 'weekly' ? [10870, 10870, 10870, 10890] : analytics.income,
        backgroundColor: '#10B981',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-900">Expense Analytics</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1 text-xs font-semibold">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${timeframe === 'weekly' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${timeframe === 'monthly' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Monthly (₹)
          </button>
        </div>
      </div>
      <div className="h-72">
        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
      </div>
    </div>
  );
}
