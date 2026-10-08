import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function ExpenseChart({ analytics = {} }) {
  const [timeframe, setTimeframe] = useState('monthly');

  const isWeekly = timeframe === 'weekly';
  const labels = isWeekly
    ? (analytics?.weekly?.labels || ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4+ (22+)'])
    : (analytics?.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']);

  const expenseData = isWeekly
    ? (analytics?.weekly?.expenses || [0, 0, 0, 0])
    : (analytics?.expenses || [0, 0, 0, 0, 0, 0]);

  const incomeData = isWeekly
    ? (analytics?.weekly?.income || [0, 0, 0, 0])
    : (analytics?.income || [0, 0, 0, 0, 0, 0]);

  const barData = {
    labels,
    datasets: [
      {
        label: 'Expenses',
        data: expenseData,
        backgroundColor: '#EF4444',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.7
      },
      {
        label: 'Income',
        data: incomeData,
        backgroundColor: '#10B981',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.7
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const val = Number(context.raw || 0);
            return ` ${context.dataset.label}: ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: {
          color: '#94A3B8',
          font: { size: 11 },
          callback: (v) => {
            if (v >= 1000) {
              return `₹${(v / 1000).toLocaleString('en-IN')}k`;
            }
            return `₹${v}`;
          }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748B',
          font: { weight: '600', size: 11 }
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Expense Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isWeekly ? 'Weekly cash flow for the current active month' : 'Rolling 6-month comparative income & expense velocity'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
              <span>Income</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
              <span>Expenses</span>
            </span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                isWeekly ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                !isWeekly ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly (₹)
            </button>
          </div>
        </div>
      </div>

      <div className="h-72">
        <Bar data={barData} options={options} />
      </div>
    </div>
  );
}
