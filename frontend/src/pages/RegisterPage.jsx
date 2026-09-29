import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { extractError } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

const RegisterPage = () => {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', username: '', password: '', fullName: '' });
  const [isLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.username || form.username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errs.password = 'Must include uppercase, lowercase, and a number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to TradeFlow.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'fullName',  label: 'Full Name',  type: 'text',     placeholder: 'Alex Johnson' },
    { name: 'email',     label: 'Email',       type: 'email',    placeholder: 'you@example.com' },
    { name: 'username',  label: 'Username',    type: 'text',     placeholder: 'alexj' },
    { name: 'password',  label: 'Password',    type: 'password', placeholder: '8+ chars, mixed case + number' },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">TF</span>
          </div>
          <span className="text-[#e8eaf0] font-semibold text-lg tracking-tight">TradeFlow</span>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-[#e8eaf0] mb-1.5">Create your account</h1>
          <p className="text-sm text-[#7a7f96]">Start tracking your investments today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={`input ${errors[name] ? 'border-red-500/50' : ''}`}
                autoComplete={name === 'password' ? 'new-password' : name}
              />
              {errors[name] && <p className="mt-1 text-xs text-red-400">{errors[name]}</p>}
            </div>
          ))}

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
            {isLoading ? <><Spinner size="sm" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#7a7f96] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
