import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, User, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Server } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  
  // Login state
  const [identifier, setIdentifier] = useState('Hardik');
  const [password, setPassword] = useState('');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login/', {
        username: identifier.trim(),
        password: password
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSuccess(`Signed in as ${res.data.user.name || res.data.user.username}! Loading your workspace...`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.error || 'Authentication failed. Please verify your Django username and password.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register/', {
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSuccess('Account created in Django! Loading your personal workspace...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } catch (err) {
      console.error('Registration error:', err);
      const errMsg = err.response?.data?.error || 'Registration failed. Username or email may already exist.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/google/', { 
        email: 'hardikpamale.4@gmail.com', 
        name: 'Hardik Pamale' 
      });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Google sign-in error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 border border-slate-800">
        
        {/* Left Hero Pane */}
        <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-600 text-white p-10 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-purple-700 font-extrabold text-xl flex items-center justify-center shadow-lg">
                E
              </div>
              <span className="text-2xl font-extrabold tracking-tight">ExpenseVision</span>
            </div>

            <div className="space-y-3 pt-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-purple-100 border border-white/20">
                <Server size={14} className="text-emerald-400" />
                <span>Multi-User Isolated Database</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight">
                Personalized Financial Workspace.
              </h2>
              <p className="text-purple-100 text-xs leading-relaxed">
                Every user has their own private ledger, separate budgets, individual reports, and a dedicated Gemini AI Copilot grounded strictly in their own transactions.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Sparkles size={16} />
                <span>Django Admin Grounded</span>
              </div>
              <p className="text-purple-100 text-[11px] leading-relaxed">
                Superusers can manage all accounts, categories, and audit ledger entries in Django Admin (<code className="bg-black/30 px-1 py-0.5 rounded text-white">/admin/</code>).
              </p>
            </div>
          </div>

          <div className="text-[11px] text-purple-200 flex items-center gap-2 pt-6">
            <ShieldCheck size={16} className="text-emerald-300" />
            <span>DRF Token & Session Authentication &bull; Data Encrypted</span>
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {isRegister ? 'Create Account' : 'Sign In'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRegister ? 'Register your private account' : 'Access your personal financial ledger'}
              </p>
            </div>
            
            {/* Mode Switcher Tab */}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
              className="text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              {isRegister ? 'Have an account? Sign In' : 'New? Register'}
            </button>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700 animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {!isRegister ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your Django username or email"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none transition" 
                    required 
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Password</label>
                  <span className="text-[10px] text-slate-400">Account password</span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none transition" 
                    required 
                  />
                </div>
              </div>

              {/* Quick User Switcher Chips */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Switch Account Demo
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIdentifier('Hardik'); setPassword('Hardik'); }}
                    className="px-2.5 py-1 bg-white hover:bg-violet-50 hover:text-violet-700 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                  >
                    👑 Hardik (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIdentifier('Rohit123'); setPassword('Hardik'); }}
                    className="px-2.5 py-1 bg-white hover:bg-violet-50 hover:text-violet-700 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                  >
                    👤 Rohit123
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ananya Patel"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. ananya"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="email" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="password" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create My Private Account'}
              </button>
            </form>
          )}

          <div className="flex items-center my-4 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
            <div className="flex-1 border-b border-slate-200" />
            <span className="px-3 text-slate-400">or</span>
            <div className="flex-1 border-b border-slate-200" />
          </div>

          {/* Google Sign-In Button */}
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-10 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
