import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { PieChart as PieIcon } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryDonutChart({ categoryBreakdown = [] }) {
  const hasData = Array.isArray(categoryBreakdown) && categoryBreakdown.length > 0;

  const labels = hasData
    ? categoryBreakdown.map(c => `${c.category} (${c.percentage}%)`)
    : [];

  const dataValues = hasData
    ? categoryBreakdown.map(c => c.amount)
    : [];

  const backgroundColors = hasData
    ? categoryBreakdown.map(c => c.color || '#3B82F6')
    : [];

  const donutData = {
    labels,
    datasets: [{
      data: dataValues,
      backgroundColor: backgroundColors,
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { size: 11, weight: 'bold' },
          color: '#475569',
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const item = categoryBreakdown[context.dataIndex];
            const amt = Number(context.raw || 0);
            return ` ${item?.category || context.label}: ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${item?.percentage || 0}%)`;
          }
        }
      }
    }
  };

  const totalExpense = hasData
    ? categoryBreakdown.reduce((sum, c) => sum + (c.amount || 0), 0)
    : 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Expense by Category</h2>
          <p className="text-xs text-slate-400 mt-0.5">Distribution across spending categories</p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-full">
          Total: ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="h-64 relative flex items-center justify-center">
        {hasData ? (
          <Doughnut data={donutData} options={options} />
        ) : (
          <div className="text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <PieIcon size={24} />
            </div>
            <p className="text-xs font-semibold text-slate-600">No expense categories to display yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Add a new expense or scan a bill to see your real category breakdown.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
