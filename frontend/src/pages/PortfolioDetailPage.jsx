import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { portfolioApi } from '../api';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatPct, pnlClass, pnlSign } from '../utils/format';
import AppLayout from '../components/common/AppLayout';
import { SkeletonTable } from '../components/common/Skeleton';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import AddTransactionModal from '../components/portfolio/AddTransactionModal';

const PortfolioDetailPage = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [showAddTx, setShowAddTx] = useState(false);
  const [activeTab, setActiveTab] = useState('holdings');

  const { data: holdingsData, isLoading: holdingsLoading, refetch: refetchHoldings } =
    useApi(() => portfolioApi.holdings(portfolioId), [portfolioId]);

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } =
    useApi(() => portfolioApi.summary(portfolioId), [portfolioId]);

  const { data: txData, isLoading: txLoading, refetch: refetchTx } =
    useApi(() => portfolioApi.getTransactions(portfolioId, { limit: 50 }), [portfolioId]);

  const { data: portfolioData } = useApi(() => portfolioApi.get(portfolioId), [portfolioId]);

  const holdings = holdingsData?.holdings || [];
  const summary = summaryData?.summary;
  const transactions = txData?.transactions || [];
  const portfolio = portfolioData?.portfolio;

  const handleRefresh = () => {
    refetchHoldings();
    refetchSummary();
    refetchTx();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/portfolios" className="text-[#7a7f96] hover:text-[#e8eaf0] text-sm transition-colors">
                Portfolios
              </Link>
              <span className="text-[#4a4f66]">/</span>
              <span className="text-sm text-[#e8eaf0]">{portfolio?.name || '…'}</span>
            </div>
            <h1 className="text-xl font-semibold text-[#e8eaf0]">{portfolio?.name || 'Portfolio'}</h1>
          </div>
          <button onClick={() => setShowAddTx(true)} className="btn-primary">
            + Add Transaction
          </button>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-xs uppercase tracking-wide text-[#7a7f96]">Holdings</p>
              <p className="text-2xl font-semibold text-[#e8eaf0]">{summary.holding_count}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs uppercase tracking-wide text-[#7a7f96]">Invested</p>
              <p className="text-2xl font-semibold mono text-[#e8eaf0]">{formatCurrency(summary.total_invested)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs uppercase tracking-wide text-[#7a7f96]">Current Value</p>
              <p className="text-2xl font-semibold mono text-[#e8eaf0]">{formatCurrency(summary.current_value)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs uppercase tracking-wide text-[#7a7f96]">P&L</p>
              <p className={`text-2xl font-semibold mono ${pnlClass(summary.pnl)}`}>
                {pnlSign(summary.pnl)}{formatCurrency(summary.pnl)}
              </p>
              <p className={`text-sm mono ${pnlClass(summary.pnl_pct)}`}>{formatPct(summary.pnl_pct)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#1e2130]">
          {['holdings', 'transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-[#7a7f96] hover:text-[#e8eaf0]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'holdings' && <span className="ml-1.5 text-xs text-[#4a4f66]">({holdings.length})</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'holdings' ? (
          holdingsLoading ? <SkeletonTable rows={4} /> : (
            <HoldingsTable
              holdings={holdings}
              portfolioId={portfolioId}
              onRefresh={handleRefresh}
            />
          )
        ) : (
          <div className="card overflow-hidden">
            {txLoading ? <SkeletonTable rows={5} cols={6} /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2130]">
                      {['Date', 'Asset', 'Type', 'Qty', 'Price', 'Total', 'Fee'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[#4a4f66]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2130]">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="table-row-hover">
                        <td className="px-4 py-3 text-xs text-[#7a7f96]">
                          {new Date(tx.transacted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm mono font-medium text-[#e8eaf0]">{tx.symbol}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            tx.type === 'buy'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm mono text-[#e8eaf0]">{parseFloat(tx.quantity).toFixed(4)}</td>
                        <td className="px-4 py-3 text-sm mono text-[#e8eaf0]">{formatCurrency(tx.price)}</td>
                        <td className="px-4 py-3 text-sm mono font-medium text-[#e8eaf0]">{formatCurrency(tx.total_amount)}</td>
                        <td className="px-4 py-3 text-sm mono text-[#7a7f96]">{formatCurrency(tx.fee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length === 0 && (
                  <div className="py-12 text-center text-sm text-[#4a4f66]">No transactions yet</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AddTransactionModal
        isOpen={showAddTx}
        onClose={() => setShowAddTx(false)}
        portfolioId={portfolioId}
        onSuccess={handleRefresh}
      />
    </AppLayout>
  );
};

export default PortfolioDetailPage;
