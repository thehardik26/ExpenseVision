import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AICopilotDrawer from './AICopilotDrawer';
import ReceiptScannerModal from './ReceiptScannerModal';
import { Sparkles } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Sync authenticated user with Django backend
    axios.get('/api/auth/me/')
      .then(res => {
        if (res.data?.is_authenticated && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      })
      .catch(err => {
        console.warn('Auth check status:', err);
      });
  }, [navigate]);

  if (!user && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        user={user}
        onOpenScanner={() => setScannerOpen(true)}
        onToggleCopilot={() => setCopilotOpen(prev => !prev)}
      />
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <Topbar user={user} />
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white px-8 py-2.5 flex items-center justify-between text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-300 animate-pulse" />
            <span>Google Gemini AI active &bull; Live Django Database Grounded</span>
          </div>
          <button
            onClick={() => setCopilotOpen(true)}
            className="bg-white text-purple-700 px-3.5 py-1 rounded-full text-xs font-bold hover:bg-purple-50 transition shadow-sm cursor-pointer"
          >
            Ask AI Advisor &rarr;
          </button>
        </div>
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          <Outlet context={{ onOpenScanner: () => setScannerOpen(true) }} />
        </div>
      </main>
      <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      <ReceiptScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
