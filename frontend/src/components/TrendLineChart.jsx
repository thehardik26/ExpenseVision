import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function TrendLineChart({ trendLine }) {
  const labels = trendLine?.labels?.length
    ? trendLine.labels
    : ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

  const incomeData = trendLine?.income?.length
    ? trendLine.income
    : [0, 0, 0, 0, 0, 0];

  const expenseData = trendLine?.expenses?.length
    ? trendLine.expenses
    : [0, 0, 0, 0, 0, 0];

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10B981'
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#EF4444'
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
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Income vs Expenses Trend</h2>
          <span className="text-xs font-semibold text-slate-400">Monthly Velocity</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Income</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Expenses</span>
          </span>
        </div>
      </div>

      <div className="h-64">
        <Line data={lineData} options={options} />
      </div>
    </div>
  );
}
