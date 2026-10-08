import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, X, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import heroImg from '../assets/auth_hero.jpg';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In state
  const [identifier, setIdentifier] = useState('Hardik');
  const [password, setPassword] = useState('admin123');

  // Sign Up state
  const [fullName, setFullName] = useState('Amélie Laurent');
  const [regEmail, setRegEmail] = useState('amelielaurent7622@gmail.com');
  const [regUsername, setRegUsername] = useState('amelielaurent');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('hardikpamale.4@gmail.com');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotToken, setForgotToken] = useState('');
  const [forgotUid, setForgotUid] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

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

      setSuccess(`Signed in successfully! Loading your workspace...`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.error || 'Invalid credentials. Please verify your username and password.';
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
      const usernameToUse = regUsername.trim() || regEmail.split('@')[0];
      const res = await axios.post('/api/auth/register/', {
        name: fullName.trim(),
        username: usernameToUse,
        email: regEmail.trim(),
        password: regPassword
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSuccess('Account created! Loading your personal workspace...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } catch (err) {
      console.error('Registration error:', err);
      const errMsg = err.response?.data?.error || 'Registration failed. Username or email may already be registered.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (demoUser = 'hardik', demoPass = 'admin123') => {
    setIdentifier(demoUser);
    setPassword(demoPass);
    setIsRegister(false);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const res = await axios.post('/api/auth/password-reset/', { email: forgotEmail.trim() });
      setForgotUid(res.data.uidb64 || '');
      setForgotToken(res.data.token || '');
      setForgotMsg(res.data.message || 'Reset token generated!');
      setForgotStep(2);
    } catch (err) {
      setForgotErr(err.response?.data?.error || 'Could not find account. Please verify email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const res = await axios.post('/api/auth/password-reset-confirm/', {
        uidb64: forgotUid,
        token: forgotToken.trim(),
        new_password: forgotNewPassword,
        email: forgotEmail.trim()
      });
      setSuccess("Password updated! You can now sign in with your new password.");
      setPassword(forgotNewPassword);
      if (res.data?.user?.username) {
        setIdentifier(res.data.user.username);
      }
      setShowForgotModal(false);
      setForgotStep(1);
    } catch (err) {
      setForgotErr(err.response?.data?.error || 'Invalid or expired token.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }
    const email = prompt("Enter Google email for Google Sign-In:", "hardikpamale.4@gmail.com");
    if (!email) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/google/', { email, name: email.split('@')[0] });
      if (res.data?.token) localStorage.setItem('token', res.data.token);
      if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));
      setSuccess("Signed in with Google! Loading dashboard...");
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err) {
      setError(err.response?.data?.error || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (window.AppleID?.auth) {
      try {
        const resp = await window.AppleID.auth.signIn();
        if (resp?.authorization?.id_token) {
          const res = await axios.post('/api/auth/apple/', { identity_token: resp.authorization.id_token });
          if (res.data?.token) localStorage.setItem('token', res.data.token);
          if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));
          navigate('/dashboard');
          return;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    const email = prompt("Enter Apple ID email for Sign in with Apple:", "amelielaurent7622@gmail.com");
    if (!email) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/apple/', { email, name: "Apple User" });
      if (res.data?.token) localStorage.setItem('token', res.data.token);
      if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));
      setSuccess("Signed in with Apple! Loading dashboard...");
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err) {
      setError(err.response?.data?.error || "Apple authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f0] flex">
      {/* Split Layout Container */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Column: Minimal Warm Editorial Form */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-8 sm:px-14 lg:px-16 py-8 sm:py-10 bg-gradient-to-b from-[#fbf9f4] via-[#faf6eb] to-[#f4ecd2]">
          
          {/* Header Brand */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold tracking-tight text-stone-900">
              ExpenseVision
            </span>
            <button
              onClick={() => handleDemoSignIn('hardik', 'admin123')}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-800 bg-white/70 border border-stone-200/60 px-3 py-1 rounded-full transition cursor-pointer shadow-2xs"
            >
              Demo Fill
            </button>
          </div>

          {/* Form Content */}
          <div className="w-full max-w-[390px] mx-auto my-auto py-8">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight leading-tight">
                {isRegister ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="text-xs text-stone-500 font-normal mt-2">
                {isRegister 
                  ? 'Sign up and get 30 day free trial' 
                  : 'Sign in to access your personal financial ledger'}
              </p>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-4 text-xs bg-rose-50 text-rose-700 px-4 py-2.5 rounded-2xl border border-rose-200/80">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 text-xs bg-emerald-50 text-emerald-800 px-4 py-2.5 rounded-2xl border border-emerald-200/80">
                {success}
              </div>
            )}

            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-stone-500 block mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Amélie Laurent"
                      required
                      className="w-full h-12 px-5 rounded-full bg-[#f4f2ea]/90 border border-stone-200/70 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-amber-200/60 placeholder:text-stone-400 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-500 block mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="amelielaurent"
                      required
                      className="w-full h-12 px-5 rounded-full bg-[#f4f2ea]/90 border border-stone-200/70 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-amber-200/60 placeholder:text-stone-400 transition-all shadow-2xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-medium text-stone-500 block mb-1.5">
                  {isRegister ? 'Email' : 'Username or email'}
                </label>
                <input
                  type={isRegister ? "email" : "text"}
                  value={isRegister ? regEmail : identifier}
                  onChange={e => isRegister ? setRegEmail(e.target.value) : setIdentifier(e.target.value)}
                  placeholder={isRegister ? "amélielaurent7622@gmail.com" : "amelie or hardik"}
                  required
                  className="w-full h-12 px-5 rounded-full bg-[#f4f2ea]/90 border border-stone-200/70 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-amber-200/60 placeholder:text-stone-400 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-500 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={isRegister ? regPassword : password}
                    onChange={e => isRegister ? setRegPassword(e.target.value) : setPassword(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    required
                    className="w-full h-12 pl-5 pr-12 rounded-full bg-[#f4f2ea]/90 border border-stone-200/70 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-amber-200/60 placeholder:text-stone-400 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isRegister && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotStep(1);
                        setForgotErr('');
                        setForgotMsg('');
                      }}
                      className="text-[11px] font-medium text-stone-500 hover:text-stone-900 underline transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Prominent Honey Yellow Pill Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#ffcc4d] hover:bg-[#fbc337] active:scale-[0.99] text-stone-900 font-semibold text-sm rounded-full shadow-sm shadow-amber-300/40 transition-all duration-200 cursor-pointer flex items-center justify-center mt-5 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : (isRegister ? 'Submit' : 'Sign in')}
              </button>

              {/* Social Login Buttons: Apple & Google */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  className="h-11 rounded-full bg-white/90 border border-stone-200/90 hover:bg-white hover:border-stone-300 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  {/* Apple Icon SVG */}
                  <svg className="w-4 h-4 fill-current text-stone-900" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.75-7.94-12.16-14.6-6.04-9.14-10.81-19.78-14.31-31.91-3.5-12.14-5.26-23.86-5.26-35.17 0-14.36 3.63-26.31 10.89-35.87 7.26-9.56 16.32-14.48 27.18-14.76 4.9 0 10.51 1.34 16.84 4.02 6.33 2.68 10.36 4.09 12.09 4.22 1.49-.13 5.62-1.57 12.4-4.33 6.78-2.76 12.28-4.04 16.5-3.83 12.7.63 22.74 5.37 30.12 14.22-11.07 6.73-16.51 16.14-16.33 28.24.18 9.54 3.86 17.55 11.04 24.03 7.18 6.48 15.82 10.23 25.92 11.25-2.07 6.13-4.54 12.39-7.41 18.79zM119.22 33.64c0-7.23 2.65-14.15 7.95-20.76 5.3-6.61 11.83-10.74 19.59-12.39.27 1.33.4 2.63.4 3.9 0 7.37-2.77 14.36-8.31 20.97-5.54 6.61-12.09 10.57-19.63 11.88-.27-1.2-.4-2.4-.4-3.6z" />
                  </svg>
                  <span>Apple</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="h-11 rounded-full bg-white/90 border border-stone-200/90 hover:bg-white hover:border-stone-300 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  {/* Google Icon SVG */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between text-xs text-stone-500 pt-6">
            <div>
              {isRegister ? (
                <span>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setIsRegister(false); setError(''); }}
                    className="underline text-stone-900 font-medium hover:text-stone-700 cursor-pointer"
                  >
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setIsRegister(true); setError(''); }}
                    className="underline text-stone-900 font-medium hover:text-stone-700 cursor-pointer"
                  >
                    Sign up
                  </button>
                </span>
              )}
            </div>

            <a href="#" className="underline text-stone-500 hover:text-stone-800 transition">
              Terms & Conditions
            </a>
          </div>

        </div>

        {/* Right Column: Editorial Hero Photo with Floating Glassmorphic UI */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 p-4 xl:p-6 items-center justify-center">
          <div className="relative w-full h-[94vh] rounded-[2.5rem] overflow-hidden shadow-2xl border border-stone-200/40 select-none">
            
            {/* Background Editorial Image */}
            <img
              src={heroImg}
              alt="Young professionals collaborating"
              className="w-full h-full object-cover object-center filter brightness-[0.98]"
            />

            {/* Subtle Gradient Veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-stone-950/15" />

            {/* Floating Top Badge */}
            <div className="absolute top-8 left-8 bg-stone-900/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full border border-white/20 text-xs font-medium shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ExpenseVision • Real-time Wealth Tracking</span>
            </div>

            {/* Floating Glassmorphic Calendar Bar */}
            <div className="absolute top-[44%] right-8 xl:right-12 w-[340px] rounded-2xl bg-white/20 backdrop-blur-xl border border-white/35 p-3.5 shadow-2xl text-white">
              {/* Days Header */}
              <div className="grid grid-cols-7 text-[10px] text-white/80 font-medium text-center mb-1">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span className="relative flex justify-center">
                  <span>Wed</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffcc4d] absolute -top-1" />
                </span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-7 text-sm font-semibold text-center items-center">
                <span>22</span>
                <span>23</span>
                <span>24</span>
                <span className="text-white font-extrabold scale-110">25</span>
                <span>26</span>
                <span>27</span>
                <span>28</span>
              </div>

              {/* Translucent diagonal hatched accent */}
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
                <span>Oct 2026 Schedule</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-white font-medium">Synced</span>
              </div>
            </div>

            {/* Floating White Meeting / Portfolio Card */}
            <div className="absolute top-[61%] right-14 xl:right-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/80 w-64 text-stone-900 transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">Daily Meeting</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5 font-medium">12:00pm - 01:00pm</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#ffcc4d]" />
              </div>

              {/* Avatar Circles */}
              <div className="flex items-center -space-x-2 mt-3 pt-2 border-t border-stone-100">
                <div className="w-7 h-7 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  AL
                </div>
                <div className="w-7 h-7 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  HD
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  SK
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  MR
                </div>
                <span className="text-[10px] text-stone-400 font-semibold pl-3">
                  +3 team
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#fbf9f4] rounded-3xl w-full max-w-md p-7 shadow-2xl border border-stone-200/90 relative text-stone-900">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Reset Password</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {forgotStep === 1 ? 'Verify account email to receive a reset token' : 'Set your new secure password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-xl hover:bg-stone-200/50 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error & Info Messages */}
            {forgotErr && (
              <div className="mb-4 text-xs bg-rose-50 text-rose-700 px-3.5 py-2.5 rounded-2xl border border-rose-200/80 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{forgotErr}</span>
              </div>
            )}
            {forgotMsg && (
              <div className="mb-4 text-xs bg-emerald-50 text-emerald-800 px-3.5 py-2.5 rounded-2xl border border-emerald-200/80 flex items-start gap-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {/* Step 1: Request Token */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-stone-500 block mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="hardikpamale.4@gmail.com"
                    className="w-full h-12 px-5 rounded-full bg-[#f4f2ea]/90 border border-stone-200/70 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-amber-200/60 placeholder:text-stone-400 transition-all shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full h-12 bg-[#ffcc4d] hover:bg-[#fbc337] active:scale-[0.99] text-stone-900 font-semibold text-sm rounded-full shadow-sm shadow-amber-300/40 transition-all duration-200 cursor-pointer flex items-center justify-center mt-3 disabled:opacity-50"
                >
                  {forgotLoading ? 'Generating token...' : 'Request Reset Token'}
                </button>
              </form>
            )}

            {/* Step 2: Confirm Reset Token & Set New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-stone-500 block mb-1.5">
                    Security Reset Token
                  </label>
                  <input
                    type="text"
                    value={forgotToken}
                    onChange={(e) => setForgotToken(e.target.value)}
                    required
                    placeholder="Enter security token"
                    className="w-full h-12 px-5 rounded-full bg-[#f4f2ea]/90 border border-stone-200/70 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-amber-200/60 placeholder:text-stone-400 transition-all shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-stone-500 block mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full h-12 px-5 rounded-full bg-[#f4f2ea]/90 border border-stone-200/70 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-amber-200/60 placeholder:text-stone-400 transition-all shadow-2xs"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-4 h-12 rounded-full border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-600 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotToken || !forgotNewPassword}
                    className="flex-1 h-12 bg-[#ffcc4d] hover:bg-[#fbc337] active:scale-[0.99] text-stone-900 font-semibold text-sm rounded-full shadow-sm shadow-amber-300/40 transition-all duration-200 cursor-pointer flex items-center justify-center disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-stone-200/60 text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-xs font-medium text-stone-500 hover:text-stone-900 underline transition cursor-pointer"
              >
                Cancel and return to sign in
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}