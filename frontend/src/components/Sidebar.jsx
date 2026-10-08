import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, PieChart, CreditCard, Sliders, 
  Camera, MessageSquare, LogOut, ShieldCheck, ExternalLink 
} from 'lucide-react';

export default function Sidebar({ user, onOpenScanner, onToggleCopilot }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout/');
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navClass = ({ isActive }) => `flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
    isActive
      ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
      : 'text-slate-500 hover:bg-violet-50 hover:text-violet-600'
  }`;

  return (
    <aside className="fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col z-40">
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-violet-500/20 ring-1 ring-white/10">
          E
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
            ExpenseVision
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-1">AI Financial Suite</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/reports" className={navClass}>
          <PieChart size={18} />
          <span>Reports</span>
        </NavLink>
        <NavLink to="/transactions" className={navClass}>
          <CreditCard size={18} />
          <span>Transactions</span>
        </NavLink>
        <NavLink to="/budgets" className={navClass}>
          <Sliders size={18} />
          <span>Budgets</span>
        </NavLink>

        <div className="my-2 border-t border-slate-100" />

        <button
          onClick={onOpenScanner}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition w-full text-left cursor-pointer"
        >
          <Camera size={18} className="text-purple-600" />
          <span>AI Receipt Scan</span>
          <span className="ml-auto bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Vision
          </span>
        </button>

        <button
          onClick={onToggleCopilot}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition w-full text-left cursor-pointer"
        >
          <MessageSquare size={18} className="text-indigo-600" />
          <span>AI Copilot</span>
          <span className="ml-auto bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            2.5
          </span>
        </button>

        {user?.is_superuser && (
          <div className="pt-2">
            <a
              href="/admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 transition group cursor-pointer"
            >
              <ShieldCheck size={16} className="text-indigo-600" />
              <div className="flex flex-col flex-1">
                <span className="font-bold text-indigo-900 leading-tight">Django Admin</span>
                <span className="text-[10px] text-indigo-500">Manage Models & DB</span>
              </div>
              <ExternalLink size={14} className="text-indigo-400 group-hover:text-indigo-700 transition" />
            </a>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {user?.avatar || 'HD'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-800 truncate">
              {user?.name || user?.username || 'Hardik'}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {user?.is_superuser ? 'Django Superuser' : user?.email || 'Logged In'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-400 hover:bg-red-50 hover:text-red-600 transition w-full cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
