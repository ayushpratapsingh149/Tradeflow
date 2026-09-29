import { formatCurrency, formatRelativeDate } from '../../utils/format';
import EmptyState from '../common/EmptyState';

const ActivityRow = ({ tx }) => {
  const isBuy = tx.type === 'buy';
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#1e2130] last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
        ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {isBuy ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#e8eaf0]">{tx.symbol}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {tx.type.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-[#7a7f96] truncate">{tx.portfolio_name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm mono text-[#e8eaf0]">{formatCurrency(tx.total_amount)}</p>
        <p className="text-xs text-[#4a4f66]">{formatRelativeDate(tx.transacted_at)}</p>
      </div>
    </div>
  );
};

const RecentActivity = ({ activities = [] }) => (
  <div className="card p-5">
    <h3 className="text-sm font-medium text-[#e8eaf0] mb-4">Recent Activity</h3>
    {activities.length === 0 ? (
      <EmptyState icon="📋" title="No activity yet" description="Your recent transactions will appear here." />
    ) : (
      <div>
        {activities.map((tx) => (
          <ActivityRow key={tx.id} tx={tx} />
        ))}
      </div>
    )}
  </div>
);

export default RecentActivity;
