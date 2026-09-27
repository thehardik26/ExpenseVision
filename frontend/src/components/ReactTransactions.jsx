import { ShoppingBag, Coffee, Film, Home, Car, Zap, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getCategoryIcon = (catName) => {
  switch (catName) {
    case 'Food & Drinks': return <Coffee size={16} className="text-blue-500" />;
    case 'Shopping': return <ShoppingBag size={16} className="text-amber-500" />;
    case 'Entertainment': return <Film size={16} className="text-pink-500" />;
    case 'Housing': return <Home size={16} className="text-cyan-500" />;
    case 'Transportation': return <Car size={16} className="text-indigo-500" />;
    case 'Bills & Utilities': return <Zap size={16} className="text-emerald-500" />;
    case 'Income': return <Briefcase size={16} className="text-purple-500" />;
    default: return <ShoppingBag size={16} className="text-slate-500" />;
  }
};

export default function RecentTransactions({ transactions = [] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
        <Link to="/transactions" className="text-xs font-bold text-violet-600 hover:text-violet-700">
          View All &rarr;
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
              <th className="pb-3 pl-2">Merchant</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Notes</th>
              <th className="pb-3 pr-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(tx => {
              const isIncome = tx.transaction_type === 'Income';
              return (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 pl-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      {getCategoryIcon(tx.category_name)}
                    </div>
                    <span className="font-bold text-slate-800">{tx.merchant}</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                      {tx.category_name}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 font-medium">{tx.date}</td>
                  <td className="py-3 text-slate-400 truncate max-w-xs">{tx.notes || '—'}</td>
                  <td className={`py-3 pr-2 text-right font-black ${isIncome ? 'text-emerald-500' : 'text-slate-900'}`}>
                    {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
