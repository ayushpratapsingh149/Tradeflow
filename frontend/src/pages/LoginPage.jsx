import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { extractError } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [isLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.identifier.trim()) errs.identifier = 'Email or username is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[420px] bg-[#0b0d13] border-r border-[#1e2130] p-10">
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">TF</span>
          </div>
          <span className="text-[#e8eaf0] font-semibold text-lg tracking-tight">TradeFlow</span>
        </div>

        <div className="space-y-6">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center mb-3 text-brand-400">◈</div>
            <h3 className="text-[#e8eaf0] font-medium mb-1">Portfolio Management</h3>
            <p className="text-sm text-[#7a7f96] leading-relaxed">Track all your investments across stocks, ETFs, and crypto in one unified view.</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">◉</div>
            <h3 className="text-[#e8eaf0] font-medium mb-1">Real-time Watchlist</h3>
            <p className="text-sm text-[#7a7f96] leading-relaxed">Monitor assets you care about with live price updates and change indicators.</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-400">◆</div>
            <h3 className="text-[#e8eaf0] font-medium mb-1">P&L Analytics</h3>
            <p className="text-sm text-[#7a7f96] leading-relaxed">Understand your performance with detailed profit and loss breakdowns.</p>
          </div>
        </div>

        <p className="text-[10px] text-[#4a4f66] mt-auto">
          © {new Date().getFullYear()} TradeFlow. All rights reserved.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#e8eaf0] mb-1.5">Welcome back</h1>
            <p className="text-sm text-[#7a7f96]">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email or Username</label>
              <input
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`input ${errors.identifier ? 'border-red-500/50' : ''}`}
                autoComplete="username"
              />
              {errors.identifier && <p className="mt-1 text-xs text-red-400">{errors.identifier}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input ${errors.password ? 'border-red-500/50' : ''}`}
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? <><Spinner size="sm" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[#7a7f96] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
