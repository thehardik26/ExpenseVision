import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryDonutChart() {
  const donutData = {
    labels: [
      'Housing (65%)', 
      'Food & Drinks (13%)', 
      'Entertainment (6%)', 
      'Shopping (5%)', 
      'Utilities (5%)', 
      'Groceries (4%)', 
      'Transportation (2%)'
    ],
    datasets: [{
      data: [65, 13, 6, 5, 5, 4, 2],
      backgroundColor: [
        '#06B6D4', // Housing
        '#3B82F6', // Food & Drinks
        '#F59E0B', // Entertainment
        '#FBBF24', // Shopping
        '#EC4899', // Utilities
        '#10B981', // Groceries
        '#6366F1'  // Transportation
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: 'bold' },
          color: '#64748B'
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">Expense by Category</h2>
        <span className="text-xs font-semibold text-slate-400">Last 6 Months</span>
      </div>
      <div className="h-64 relative">
        <Doughnut data={donutData} options={options} />
      </div>
    </div>
  );
}
