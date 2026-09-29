import { formatCurrency, formatPct, pnlClass } from '../../utils/format';

export const StatCard = ({ label, value, sub, subClass = '', accent = false }) => (
  <div className={`stat-card ${accent ? 'border-brand-600/20 bg-brand-600/5' : ''}`}>
    <p className="text-xs font-medium uppercase tracking-wide text-[#7a7f96]">{label}</p>
    <p className={`text-2xl font-semibold mono ${accent ? 'text-brand-400' : 'text-[#e8eaf0]'}`}>{value}</p>
    {sub && <p className={`text-sm ${subClass}`}>{sub}</p>}
  </div>
);

export const PnLStatCard = ({ label, invested, currentValue, pnl, pnlPct }) => (
  <div className="stat-card">
    <p className="text-xs font-medium uppercase tracking-wide text-[#7a7f96]">{label}</p>
    <p className="text-2xl font-semibold mono text-[#e8eaf0]">{formatCurrency(currentValue)}</p>
    <div className="flex items-center justify-between">
      <p className="text-sm text-[#7a7f96]">
        Invested: <span className="text-[#e8eaf0] mono">{formatCurrency(invested)}</span>
      </p>
      <span className={`badge-${parseFloat(pnl) >= 0 ? 'success' : 'danger'} mono`}>
        {parseFloat(pnl) >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(pnl))} ({formatPct(pnlPct)})
      </span>
    </div>
  </div>
);

export const MiniStat = ({ label, value, change }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#1e2130] last:border-0">
    <span className="text-sm text-[#7a7f96]">{label}</span>
    <div className="text-right">
      <span className="text-sm font-medium mono text-[#e8eaf0]">{value}</span>
      {change !== undefined && (
        <span className={`ml-2 text-xs mono ${pnlClass(change)}`}>{formatPct(change, true)}</span>
      )}
    </div>
  </div>
);
