import { useState } from 'react';
import Modal from '../common/Modal';
import { portfolioApi, assetApi } from '../../api';
import { useMutation } from '../../hooks/useApi';
import { useToast } from '../../store/ToastContext';
import { extractError } from '../../utils/format';
import Spinner from '../common/Spinner';

const AddTransactionModal = ({ isOpen, onClose, portfolioId, onSuccess }) => {
  const toast = useToast();
  const [form, setForm] = useState({
    assetId: '', type: 'buy', quantity: '', price: '', fee: '', notes: '',
    transactedAt: new Date().toISOString().split('T')[0],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  const { mutate, isLoading } = useMutation(
    (data) => portfolioApi.addTransaction(portfolioId, data),
    {
      onSuccess: () => {
        toast.success('Transaction recorded');
        onSuccess?.();
        handleClose();
      },
      onError: (msg) => toast.error(msg),
    }
  );

  const handleClose = () => {
    setForm({ assetId: '', type: 'buy', quantity: '', price: '', fee: '', notes: '', transactedAt: new Date().toISOString().split('T')[0] });
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAsset(null);
    setErrors({});
    onClose();
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    setSelectedAsset(null);
    setForm((prev) => ({ ...prev, assetId: '' }));
    if (q.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await assetApi.search({ q, limit: 8 });
      setSearchResults(res.data?.data?.items || []);
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  };

  const selectAsset = (asset) => {
    setSelectedAsset(asset);
    setForm((prev) => ({ ...prev, assetId: asset.id }));
    setSearchQuery(asset.symbol);
    setSearchResults([]);
  };

  const validate = () => {
    const errs = {};
    if (!form.assetId) errs.assetId = 'Select an asset';
    if (!form.quantity || parseFloat(form.quantity) <= 0) errs.quantity = 'Quantity must be positive';
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Price must be positive';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      await mutate({
        ...form,
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
        fee: parseFloat(form.fee) || 0,
        transactedAt: new Date(form.transactedAt).toISOString(),
      });
    } catch { /* handled */ }
  };

  const totalAmount = parseFloat(form.quantity || 0) * parseFloat(form.price || 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset Search */}
        <div className="relative">
          <label className="label">Asset</label>
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search symbol or name (e.g. AAPL, Bitcoin)"
            className={`input ${errors.assetId ? 'border-red-500/50' : ''}`}
          />
          {searching && (
            <div className="absolute right-3 top-9"><Spinner size="sm" /></div>
          )}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[#13151f] border border-[#1e2130] rounded-xl shadow-2xl overflow-hidden">
              {searchResults.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selectAsset(a)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1a1d27] transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-[#e8eaf0] mono">{a.symbol}</span>
                    <span className="ml-2 text-xs text-[#7a7f96]">{a.asset_name}</span>
                  </div>
                  <span className="text-xs text-[#4a4f66] bg-[#1a1d27] px-2 py-0.5 rounded-full">
                    {a.category_name}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selectedAsset && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-[#7a7f96]">
              <span className="text-emerald-400">✓</span>
              {selectedAsset.asset_name} — {selectedAsset.exchange || 'N/A'} · {selectedAsset.category_name}
            </div>
          )}
          {errors.assetId && <p className="mt-1 text-xs text-red-400">{errors.assetId}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="label">Transaction Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['buy', 'sell'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, type: t }))}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                  form.type === t
                    ? t === 'buy'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                    : 'bg-[#1a1d27] border-[#1e2130] text-[#7a7f96] hover:border-[#252839]'
                }`}
              >
                {t === 'buy' ? '↑ Buy' : '↓ Sell'}
              </button>
            ))}
          </div>
        </div>

        {/* Qty + Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              step="any"
              min="0"
              name="quantity"
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              placeholder="0.00"
              className={`input ${errors.quantity ? 'border-red-500/50' : ''}`}
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-400">{errors.quantity}</p>}
          </div>
          <div>
            <label className="label">Price (USD)</label>
            <input
              type="number"
              step="any"
              min="0"
              name="price"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="0.00"
              className={`input ${errors.price ? 'border-red-500/50' : ''}`}
            />
            {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
          </div>
        </div>

        {/* Fee + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fee (optional)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={form.fee}
              onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))}
              placeholder="0.00"
              className="input"
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={form.transactedAt}
              onChange={(e) => setForm((p) => ({ ...p, transactedAt: e.target.value }))}
              className="input"
            />
          </div>
        </div>

        {/* Total */}
        {totalAmount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#1a1d27] border border-[#1e2130]">
            <span className="text-xs text-[#7a7f96]">Total Amount</span>
            <span className="text-sm font-semibold mono text-[#e8eaf0]">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Add a note…"
            rows={2}
            className="input resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? <><Spinner size="sm" /> Saving…</> : 'Record Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTransactionModal;
