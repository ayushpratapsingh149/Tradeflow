import { useState, useCallback } from 'react';
import { assetApi } from '../api';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatPct, pnlClass } from '../utils/format';
import AppLayout from '../components/common/AppLayout';
import { SkeletonTable } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

const CATEGORIES = [
  { label: 'All', value: null },
  { label: 'Stocks', value: 'stocks' },
  { label: 'ETFs', value: 'etfs' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Commodities', value: 'commodities' },
  { label: 'Bonds', value: 'bonds' },
];

const AssetsPage = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const { data, isLoading } = useApi(
    () => assetApi.list(activeCategory ? { category: activeCategory } : {}),
    [activeCategory]
  );

  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const res = await assetApi.search({ q, limit: 30 });
      setSearchResults(res.data?.data?.items || []);
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  }, []);

  const assets = searchResults ?? data?.assets ?? [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-[#e8eaf0]">Assets</h1>
          <p className="text-sm text-[#7a7f96] mt-0.5">Browse available investment instruments</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by symbol or name…"
              className="input pr-8"
            />
            {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size="sm" /></div>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={String(cat.value)}
                onClick={() => { setActiveCategory(cat.value); setSearchQuery(''); setSearchResults(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                  activeCategory === cat.value && !searchResults
                    ? 'bg-brand-600/15 border-brand-600/30 text-brand-400'
                    : 'bg-[#1a1d27] border-[#1e2130] text-[#7a7f96] hover:border-[#252839] hover:text-[#e8eaf0]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading && !searchResults ? (
          <SkeletonTable rows={8} cols={5} />
        ) : assets.length === 0 ? (
          <div className="card">
            <EmptyState icon="◆" title="No assets found" description="Try adjusting your search or filter." />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2130]">
                    {['Symbol', 'Name', 'Category', 'Exchange', 'Currency', 'Price', '24h Chg'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[#4a4f66]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2130]">
                  {assets.map((a) => (
                    <tr key={a.id} className="table-row-hover">
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold mono text-[#e8eaf0]">{a.symbol}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#7a7f96] block truncate max-w-[200px]">{a.name || a.asset_name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="badge-neutral">{a.category_name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#7a7f96]">{a.exchange || '—'}</td>
                      <td className="px-4 py-3.5 text-sm mono text-[#7a7f96]">{a.currency}</td>
                      <td className="px-4 py-3.5 text-sm mono text-[#e8eaf0]">
                        {a.current_price ? formatCurrency(a.current_price) : <span className="text-[#4a4f66]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {a.change_pct != null ? (
                          <span className={`text-sm mono ${pnlClass(a.change_pct)}`}>{formatPct(a.change_pct)}</span>
                        ) : <span className="text-[#4a4f66]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[#1e2130] text-xs text-[#4a4f66]">
              {assets.length} assets
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AssetsPage;
