import { useState, useCallback } from 'react';
import { watchlistApi, assetApi } from '../api';
import { useApi, useMutation } from '../hooks/useApi';
import { useToast } from '../store/ToastContext';
import { formatCurrency, formatPct, pnlClass } from '../utils/format';
import AppLayout from '../components/common/AppLayout';
import { SkeletonTable } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

const WatchlistPage = () => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const { data, isLoading, refetch } = useApi(() => watchlistApi.get({ limit: 50 }));
  const items = data?.items || [];

  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await assetApi.search({ q, limit: 8 });
      setSearchResults(res.data?.data?.items || []);
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  }, []);

  const handleAdd = async (assetId) => {
    setAddingId(assetId);
    try {
      await watchlistApi.add(assetId);
      toast.success('Added to watchlist');
      setSearchResults([]);
      setSearchQuery('');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (assetId) => {
    setRemovingId(assetId);
    try {
      await watchlistApi.remove(assetId);
      toast.success('Removed from watchlist');
      refetch();
    } catch {
      toast.error('Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  const watchedIds = new Set(items.map((i) => i.asset_id));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-[#e8eaf0]">Watchlist</h1>
          <p className="text-sm text-[#7a7f96] mt-0.5">Monitor assets you care about</p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search and add assets to your watchlist…"
            className="input pr-10"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size="sm" />
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[#13151f] border border-[#1e2130] rounded-xl shadow-2xl overflow-hidden">
              {searchResults.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1d27] transition-colors border-b border-[#1e2130] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-medium mono text-[#e8eaf0]">{a.symbol}</span>
                      <span className="ml-2 text-xs text-[#7a7f96]">{a.asset_name}</span>
                    </div>
                    <span className="text-xs text-[#4a4f66] bg-[#1a1d27] border border-[#1e2130] px-2 py-0.5 rounded-full">
                      {a.category_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.current_price && (
                      <span className="text-sm mono text-[#e8eaf0]">{formatCurrency(a.current_price)}</span>
                    )}
                    {watchedIds.has(a.id) ? (
                      <span className="text-xs text-[#4a4f66]">Watching</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(a.id)}
                        disabled={addingId === a.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-brand-600/10 text-brand-400 border border-brand-600/20 hover:bg-brand-600/20 transition-colors disabled:opacity-50"
                      >
                        {addingId === a.id ? <Spinner size="sm" /> : '+ Watch'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist table */}
        {isLoading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : items.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="◉"
              title="Your watchlist is empty"
              description="Search for assets above to add them to your watchlist."
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2130]">
                    {['Symbol', 'Name', 'Category', 'Price', '24h Change', 'Open', 'High', 'Low', 'Added', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[#4a4f66]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2130]">
                  {items.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold mono text-[#e8eaf0]">{item.symbol}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[#7a7f96] truncate max-w-[140px] block">{item.asset_name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="badge-neutral">{item.category_name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm mono text-[#e8eaf0]">
                        {item.current_price ? formatCurrency(item.current_price) : <span className="text-[#4a4f66]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.change_pct !== null ? (
                          <span className={`text-sm mono font-medium ${pnlClass(item.change_pct)}`}>
                            {formatPct(item.change_pct)}
                          </span>
                        ) : <span className="text-[#4a4f66]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm mono text-[#7a7f96]">
                        {item.open_price ? formatCurrency(item.open_price) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm mono text-emerald-400/70">
                        {item.high_price ? formatCurrency(item.high_price) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm mono text-red-400/70">
                        {item.low_price ? formatCurrency(item.low_price) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#4a4f66]">
                        {new Date(item.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleRemove(item.asset_id)}
                          disabled={removingId === item.asset_id}
                          className="text-[#4a4f66] hover:text-red-400 transition-colors text-sm p-1 rounded"
                          title="Remove from watchlist"
                        >
                          {removingId === item.asset_id ? <Spinner size="sm" /> : '✕'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WatchlistPage;
