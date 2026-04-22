import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, LogIn, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { loginUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginUser(email, password);
      if (!result.success) {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-tg-orange-500/10 dark:bg-tg-orange-500/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tg-orange-500/10 dark:bg-tg-orange-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl text-tg-orange-500 hover:scale-110 transition-transform"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -12 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] mb-6 shadow-2xl shadow-tg-orange-500/20 border border-slate-100 dark:border-slate-800 p-1"
          >
            <div className="w-full h-full bg-tg-orange-600 rounded-[1.8rem] flex items-center justify-center text-white font-black text-3xl italic tracking-tighter shadow-inner">
              TG
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight"
          >
            Techno<span className="text-tg-orange-600">Guide</span>
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">M&T InfoSoft Pvt. Ltd.</p>
        </div>

        <div className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8">Welcome Back</h2>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl"
              >
                <p className="text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                  <span className="text-lg">✕</span> {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@technoguide.com"
                  required
                  className="input-field w-full pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tg-orange-600 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field w-full pl-12"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer sr-only" id="remember" />
                  <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-800 rounded-lg group-hover:border-tg-orange-400 transition-colors peer-checked:bg-tg-orange-600 peer-checked:border-tg-orange-600 flex items-center justify-center">
                    <div className="w-2.5 h-1 border-b-2 border-l-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100"></div>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 uppercase tracking-[0.2em] text-xs font-black disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <LogIn size={18} />
              {loading ? 'Authenticating...' : 'Sign In To Panel'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800/50">
            <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center mb-4 font-black uppercase tracking-[0.2em]">Authorized Personnel Only</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1 items-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Admin Console Access</span>
                <code className="text-tg-orange-600 dark:text-tg-orange-400 font-mono text-xs font-black">admin.technoguide.cloud</code>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-[0.1em]">© 2026 TechnoGuide Systems</p>
          <p className="text-[10px] text-tg-orange-500/60 font-black uppercase tracking-[0.4em] mt-3">Touch the Sky</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
