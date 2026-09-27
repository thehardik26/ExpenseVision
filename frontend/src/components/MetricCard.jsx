export default function MetricCard({ title, value, delta, isPositive, type }) {
  const colorMap = {
    income: 'text-emerald-500',
    expense: 'text-rose-500',
    savings: 'text-violet-600',
    default: 'text-slate-900'
  };

  const isNegative = typeof value === 'string' && value.startsWith('-');

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
      <div className={`text-3xl font-extrabold tracking-tight my-2 ${isNegative && type !== 'expense' ? 'text-rose-600' : (colorMap[type] || colorMap.default)}`}>
        {value}
      </div>
      <span className={`text-xs font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        <span>{isPositive ? '↗' : '↘'}</span>
        <span>{delta}</span>
      </span>
    </div>
  );
}
