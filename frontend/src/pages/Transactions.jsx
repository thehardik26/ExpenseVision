import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Plus, 
  Trash2, 
  Coffee, 
  ShoppingBag, 
  Film, 
  Home, 
  Car, 
  Zap, 
  Briefcase 
} from 'lucide-react';

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

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Fetch transactions from backend
  const fetchTransactions = () => {
    setLoading(true);
    axios.get('/api/transactions/')
      .then(res => {
        setTransactions(res.data);
      })
      .catch(err => {
        console.error("Transactions fetch error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Delete transaction handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await axios.delete(`/api/transactions/${id}/`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch {
      // Optimistic delete
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Filter transactions based on Search, Category, and Type
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const merchant = (tx.merchant || '').toLowerCase();
      const notes = (tx.notes || '').toLowerCase();
      const category = (tx.category_name || '').toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = merchant.includes(query) || notes.includes(query) || category.includes(query);
      const matchesCategory = selectedCategory === 'ALL' || tx.category_name === selectedCategory;
      const matchesType = selectedType === 'ALL' || tx.transaction_type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, search, selectedCategory, selectedType]);

  // Export CSV function (as in master plan)
  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    let csv = "Date,Merchant,Category,Notes,Type,Amount\n";
    filteredTransactions.forEach(t => {
      csv += `"${t.date}","${t.merchant}","${t.category_name}","${t.notes || ''}","${t.transaction_type}","${t.amount}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'expensevision_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transactions Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete historical ledger of income and expenses &bull; {filteredTransactions.length} recorded
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Transaction</span>
          </Link>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search merchant, description, or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Food & Drinks">Food & Drinks</option>
            <option value="Shopping">Shopping</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Bills & Utilities">Bills & Utilities</option>
            <option value="Housing">Housing</option>
            <option value="Groceries">Groceries</option>
            <option value="Income">Income</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="w-full sm:w-40">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="Expense">Expense Only</option>
            <option value="Income">Income Only</option>
          </select>
        </div>
      </div>

      {/* 3. Full Ledger Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold animate-pulse">Loading Ledger...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">
            No transactions found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Merchant / Vendor</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 pr-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(tx => {
                  const isIncome = tx.transaction_type === 'Income';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pl-2 text-slate-500 font-medium whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getCategoryIcon(tx.category_name)}
                        </div>
                        <span className="font-bold text-slate-900">{tx.merchant}</span>
                      </td>

                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-100 whitespace-nowrap">
                          {tx.category_name}
                        </span>
                      </td>

                      <td className="py-3.5 text-slate-400 max-w-xs truncate">
                        {tx.notes || '—'}
                      </td>

                      <td className={`py-3.5 text-right font-black whitespace-nowrap ${isIncome ? 'text-emerald-500' : 'text-slate-900'}`}>
                        {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                      </td>

                      <td className="py-3.5 pr-2 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          title="Delete Transaction"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
