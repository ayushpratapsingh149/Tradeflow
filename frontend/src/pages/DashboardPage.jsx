import { portfolioApi } from '../api';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatPct, pnlClass, pnlSign } from '../utils/format';
import AppLayout from '../components/common/AppLayout';
import { SkeletonCard } from '../components/common/Skeleton';
import { StatCard, PnLStatCard } from '../components/dashboard/StatCard';
import DistributionChart from '../components/dashboard/DistributionChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import EmptyState from '../components/common/EmptyState';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { data, isLoading, error } = useApi(() => portfolioApi.dashboard());

  const summary = data?.summary;
  const distribution = data?.distribution || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#e8eaf0]">Dashboard</h1>
            <p className="text-sm text-[#7a7f96] mt-0.5">Your portfolio at a glance</p>
          </div>
          <Link to="/portfolios" className="btn-primary">
            + Add Investment
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : !summary?.portfolio_count ? (
          <div className="card">
            <EmptyState
              icon="📊"
              title="No portfolios yet"
              description="Create your first portfolio to start tracking your investments."
              action={<Link to="/portfolios" className="btn-primary">Create Portfolio</Link>}
            />
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Portfolios"
                value={summary.portfolio_count}
                sub={`${summary.total_holdings} holdings`}
                subClass="text-[#7a7f96] text-sm"
              />
              <StatCard
                label="Total Invested"
                value={formatCurrency(summary.total_invested)}
                accent
              />
              <StatCard
                label="Current Value"
                value={formatCurrency(summary.current_value)}
                sub={
                  <span className={pnlClass(summary.total_pnl)}>
                    {pnlSign(summary.total_pnl)}{formatCurrency(summary.total_pnl)} ({formatPct(summary.total_pnl_pct)})
                  </span>
                }
              />
              <StatCard
                label="Total P&L"
                value={
                  <span className={pnlClass(summary.total_pnl)}>
                    {pnlSign(summary.total_pnl)}{formatCurrency(summary.total_pnl)}
                  </span>
                }
                sub={
                  <span className={pnlClass(summary.total_pnl_pct)}>
                    {formatPct(summary.total_pnl_pct)} all time
                  </span>
                }
              />
            </div>

            {/* Charts + activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <DistributionChart data={distribution} />
              </div>
              <div className="lg:col-span-2">
                <RecentActivity activities={recentActivity} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
