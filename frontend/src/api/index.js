import api from './client';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register:  (data)  => api.post('/auth/register', data),
  login:     (data)  => api.post('/auth/login', data),
  logout:    (data)  => api.post('/auth/logout', data),
  refresh:   (data)  => api.post('/auth/refresh', data),
  me:        ()      => api.get('/auth/me'),
};

// ─── Portfolios ───────────────────────────────────────────────────────────────
export const portfolioApi = {
  list:         ()                       => api.get('/portfolios'),
  get:          (id)                     => api.get(`/portfolios/${id}`),
  create:       (data)                   => api.post('/portfolios', data),
  update:       (id, data)               => api.put(`/portfolios/${id}`, data),
  delete:       (id)                     => api.delete(`/portfolios/${id}`),
  summary:      (id)                     => api.get(`/portfolios/${id}/summary`),
  dashboard:    ()                       => api.get('/portfolios/dashboard'),

  holdings:     (id)                     => api.get(`/portfolios/${id}/holdings`),
  deleteHolding:(portfolioId, holdingId) => api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`),

  addTransaction:   (id, data)  => api.post(`/portfolios/${id}/transactions`, data),
  getTransactions:  (id, params) => api.get(`/portfolios/${id}/transactions`, { params }),
};

// ─── Assets ───────────────────────────────────────────────────────────────────
export const assetApi = {
  list:   (params) => api.get('/assets', { params }),
  get:    (id)     => api.get(`/assets/${id}`),
  search: (params) => api.get('/assets/search', { params }),
};

// ─── Watchlist ────────────────────────────────────────────────────────────────
export const watchlistApi = {
  get:    (params)  => api.get('/assets/watchlist', { params }),
  add:    (assetId) => api.post('/assets/watchlist', { assetId }),
  remove: (assetId) => api.delete(`/assets/watchlist/${assetId}`),
};
