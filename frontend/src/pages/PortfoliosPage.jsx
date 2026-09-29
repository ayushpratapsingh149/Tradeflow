import { useState } from 'react';
import { Link } from 'react-router-dom';
import { portfolioApi } from '../api';
import { useApi, useMutation } from '../hooks/useApi';
import { useToast } from '../store/ToastContext';
import { formatCurrency, formatPct, pnlClass, pnlSign, extractError } from '../utils/format';
import AppLayout from '../components/common/AppLayout';
import { SkeletonCard } from '../components/common/Skeleton';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

const CreatePortfolioModal = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '', currency: 'USD' });
  const [errors, setErrors] = useState({});

  const { mutate, isLoading } = useMutation(
    (data) => portfolioApi.create(data),
    {
      onSuccess: () => { toast.success('Portfolio created'); onSuccess?.(); onClose(); },
      onError: (msg) => toast.error(msg),
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    await mutate(form).catch(() => {});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Portfolio">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Portfolio Name</label>
          <input
            value={form.name}
            onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors({}); }}
            placeholder="e.g. Long-term Growth"
            className={`input ${errors.name ? 'border-red-500/50' : ''}`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="What's this portfolio for?"
            rows={2}
            className="input resize-none"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? <><Spinner size="sm" /> Creating…</> : 'Create Portfolio'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const PortfolioCard = ({ portfolio, onDelete }) => {
  const summary = portfolio;
  return (
    <Link
      to={`/portfolios/${portfolio.id}`}
      className="card-hover p-5 block group transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#e8eaf0]">{portfolio.name}</h3>
            {portfolio.is_default ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-600/15 text-brand-400 border border-brand-600/20">default</span>
            ) : null}
          </div>
          {portfolio.description && (
            <p className="text-xs text-[#7a7f96] mt-0.5 truncate max-w-[200px]">{portfolio.description}</p>
          )}
        </div>
        <span className="text-[#4a4f66] text-xs">{portfolio.holding_count} holdings</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#7a7f96]">Currency</span>
          <span className="mono text-[#e8eaf0]">{portfolio.currency}</span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#1e2130]">
        <span className="text-xs text-brand-400 group-hover:text-brand-300 transition-colors">
          View portfolio →
        </span>
      </div>
    </Link>
  );
};

const PortfoliosPage = () => {
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, error, refetch } = useApi(() => portfolioApi.list());

  const portfolios = data?.portfolios || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#e8eaf0]">Portfolios</h1>
            <p className="text-sm text-[#7a7f96] mt-0.5">Manage your investment portfolios</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Portfolio
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} rows={3} />)}
          </div>
        ) : error ? (
          <div className="card p-8 text-center"><p className="text-red-400 text-sm">{error}</p></div>
        ) : portfolios.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="◈"
              title="No portfolios yet"
              description="Create your first portfolio to start tracking investments."
              action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Portfolio</button>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => (
              <PortfolioCard key={p.id} portfolio={p} />
            ))}
          </div>
        )}
      </div>

      <CreatePortfolioModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={refetch}
      />
    </AppLayout>
  );
};

export default PortfoliosPage;
