import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100">
        <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion size={40} className="animate-bounce" />
        </div>
        <div className="space-y-2">
          <span className="text-6xl font-black tracking-tight bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
            404
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The financial report, budget sheet, or page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>

          <Link 
            to="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer"
          >
            <Home size={16} />
            <span>Dashboard</span>
          </Link>
        </div>
        <div className="pt-4 text-[11px] text-slate-400 border-t border-slate-100">
          ExpenseVision &bull; AI Financial Intelligence
        </div>
      </div>
    </div>
  );
}
