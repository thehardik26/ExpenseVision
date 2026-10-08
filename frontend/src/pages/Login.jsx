import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, X, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import heroImg from '../assets/auth_hero.jpg';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [identifier, setIdentifier] = useState('Hardik');
  const [password, setPassword] = useState('admin123');

  const [fullName, setFullName] = useState('Amélie Laurent');
  const [regEmail, setRegEmail] = useState('amelielaurent7622@gmail.com');
  const [regUsername, setRegUsername] = useState('amelielaurent');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  return (
    <div className="min-h-screen bg-[#faf7f0] flex">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-8 sm:px-14 lg:px-16 py-8 sm:py-10 bg-gradient-to-b from-[#fbf9f4] via-[#faf6eb] to-[#f4ecd2]">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#ffcc4d] hover:bg-[#fbc337] active:scale-[0.99] text-stone-900 font-semibold text-sm rounded-full shadow-sm shadow-amber-300/40 transition-all duration-200 cursor-pointer flex items-center justify-center mt-5 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : (isRegister ? 'Submit' : 'Sign in')}
              </button>
            </form>
          </div>

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

        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 p-4 xl:p-6 items-center justify-center">
          <div className="relative w-full h-[94vh] rounded-[2.5rem] overflow-hidden shadow-2xl border border-stone-200/40 select-none">
            <img
              src={heroImg}
              alt="Young professionals collaborating"
              className="w-full h-full object-cover object-center filter brightness-[0.98]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-stone-950/15" />

            <div className="absolute top-8 left-8 bg-stone-900/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full border border-white/20 text-xs font-medium shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ExpenseVision • Real-time Wealth Tracking</span>
            </div>

            <div className="absolute top-[44%] right-8 xl:right-12 w-[340px] rounded-2xl bg-white/20 backdrop-blur-xl border border-white/35 p-3.5 shadow-2xl text-white">
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

              <div className="grid grid-cols-7 text-sm font-semibold text-center items-center">
                <span>22</span>
                <span>23</span>
                <span>24</span>
                <span className="text-white font-extrabold scale-110">25</span>
                <span>26</span>
                <span>27</span>
                <span>28</span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
                <span>Oct 2026 Schedule</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-white font-medium">Synced</span>
              </div>
            </div>

            <div className="absolute top-[61%] right-14 xl:right-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/80 w-64 text-stone-900 transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">Daily Meeting</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5 font-medium">12:00pm - 01:00pm</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#ffcc4d]" />
              </div>

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

      {showForgotModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#fbf9f4] rounded-3xl w-full max-w-md p-7 shadow-2xl border border-stone-200/90 relative text-stone-900">
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