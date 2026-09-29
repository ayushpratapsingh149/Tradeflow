/**
 * Format a number as currency
 */
export const formatCurrency = (val, currency = 'USD', decimals = 2) => {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format a number with commas
 */
export const formatNumber = (val, decimals = 2) => {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format a percentage
 */
export const formatPct = (val, showSign = true) => {
  const num = parseFloat(val) || 0;
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

/**
 * Format compact numbers (1.2K, 3.4M)
 */
export const formatCompact = (val) => {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(num);
};

/**
 * Relative date string
 */
export const formatRelativeDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (secs < 60) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Format date for display
 */
export const formatDate = (date, options = {}) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', ...options,
  });
};

/**
 * Determine P&L color class
 */
export const pnlClass = (val) => {
  const num = parseFloat(val);
  if (num > 0) return 'text-emerald-400';
  if (num < 0) return 'text-red-400';
  return 'text-[#7a7f96]';
};

/**
 * Determine P&L sign
 */
export const pnlSign = (val) => (parseFloat(val) > 0 ? '+' : '');

/**
 * Extract error message from axios error
 */
export const extractError = (err) =>
  err?.response?.data?.message || err?.message || 'An unexpected error occurred';

/**
 * Truncate text
 */
export const truncate = (str, max = 30) =>
  str?.length > max ? `${str.slice(0, max)}…` : str;

/**
 * Category color map for charts
 */
export const CATEGORY_COLORS = {
  stocks:       '#6271f5',
  etfs:         '#22c55e',
  crypto:       '#f59e0b',
  bonds:        '#3b82f6',
  commodities:  '#ec4899',
  'mutual-funds': '#8b5cf6',
};

export const getCategoryColor = (slug) =>
  CATEGORY_COLORS[slug] || '#7a7f96';
