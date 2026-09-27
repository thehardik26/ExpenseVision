import { Bell, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';

export default function Topbar({ user }) {
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Overview</h1>
        {user?.is_superuser && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700">
            <ShieldCheck size={13} className="text-indigo-600" />
            Django Admin
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Real-time Current Date Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs">
          <Calendar size={14} className="text-violet-600" />
          <span>{todayFormatted}</span>
        </div>

        {user?.is_superuser && (
          <a
            href="http://127.0.0.1:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            <span>Django Admin</span>
            <ExternalLink size={13} className="opacity-70" />
          </a>
        )}

        <button 
          onClick={() => alert(`ExpenseVision: Real-time ledger updated for ${todayFormatted}`)}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-violet-600 relative transition cursor-pointer"
        >
          <Bell size={18} />
          <span className="w-2 h-2 bg-red-500 rounded-full absolute top-2.5 right-2.5 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-800 leading-tight block">
              {user?.name || user?.username || 'Hardik'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {user?.is_superuser ? 'Superuser' : user?.email || 'User'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm border-2 border-violet-200 select-none shadow-sm">
            {user?.avatar || 'HD'}
          </div>
        </div>
      </div>
    </header>
  );
}
