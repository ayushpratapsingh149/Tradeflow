import { useState } from 'react';
import { formatCurrency, formatNumber, formatPct, pnlClass, pnlSign } from '../../utils/format';
import { portfolioApi } from '../../api';
import { useMutation } from '../../hooks/useApi';
import { useToast } from '../../store/ToastContext';
import EmptyState from '../common/EmptyState';
import Spinner from '../common/Spinner';

const HoldingsTable = ({ holdings = [], portfolioId, onRefresh }) => {
  const toast = useToast();
  const [deletingId, setDeletingId] = useState(null);

  const { mutate: deleteHolding } = useMutation(
    ({ portfolioId, holdingId }) => portfolioApi.deleteHolding(portfolioId, holdingId),
    {
      onSuccess: () => { toast.success('Holding removed'); onRefresh?.(); },
      onError: (msg) => toast.error(msg),
    }
  );

  const handleDelete = async (holdingId) => {
    if (!confirm('Remove this holding and all its transaction history?')) return;
    setDeletingId(holdingId);
    try {
      await deleteHolding({ portfolioId, holdingId });
    } finally {
      setDeletingId(null);
    }
  };

  if (!holdings.length) {
    return (
      <div className="card">
        <EmptyState
          icon="◈"
          title="No holdings yet"
          description="Add your first transaction to start tracking this portfolio."
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2130]">
              {['Asset', 'Category', 'Quantity', 'Avg Buy', 'Curr. Price', 'Invested', 'Value', 'P&L', 'P&L %', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[#4a4f66] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2130]">
            {holdings.map((h) => (
              <tr key={h.id} className="table-row-hover">
                <td className="px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold mono text-[#e8eaf0]">{h.symbol}</p>
                    <p className="text-xs text-[#4a4f66] truncate max-w-[120px]">{h.asset_name}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="badge-neutral">{h.category_name}</span>
                </td>
                <td className="px-4 py-3.5 text-sm mono text-[#e8eaf0]">
                  {formatNumber(h.quantity, 4)}
                </td>
                <td className="px-4 py-3.5 text-sm mono text-[#e8eaf0]">
                  {formatCurrency(h.avg_buy_price)}
                </td>
                <td className="px-4 py-3.5">
                  <div>
                    <p className="text-sm mono text-[#e8eaf0]">
                      {h.current_price ? formatCurrency(h.current_price) : <span className="text-[#4a4f66]">—</span>}
                    </p>
                    {h.change_pct !== null && (
                      <p className={`text-xs mono ${pnlClass(h.change_pct)}`}>{formatPct(h.change_pct)}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm mono text-[#e8eaf0]">
                  {formatCurrency(h.total_invested)}
                </td>
                <td className="px-4 py-3.5 text-sm mono text-[#e8eaf0]">
                  {h.current_price ? formatCurrency(h.current_value) : <span className="text-[#4a4f66]">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-sm mono ${pnlClass(h.pnl)}`}>
                    {pnlSign(h.pnl)}{formatCurrency(h.pnl)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-sm mono ${pnlClass(h.pnl_pct)}`}>
                    {pnlSign(h.pnl_pct)}{formatPct(h.pnl_pct)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => handleDelete(h.id)}
                    disabled={deletingId === h.id}
                    className="text-[#4a4f66] hover:text-red-400 transition-colors text-sm p-1 rounded"
                    title="Remove holding"
                  >
                    {deletingId === h.id ? <Spinner size="sm" /> : '✕'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;
