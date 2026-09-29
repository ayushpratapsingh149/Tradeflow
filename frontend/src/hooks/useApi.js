import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic async data fetching hook
 * @param {Function} fetchFn - async function returning axios response
 * @param {Array}    deps    - dependency array (like useEffect)
 * @param {Object}   options - { immediate, onSuccess, onError }
 */
export const useApi = (fetchFn, deps = [], options = {}) => {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData]       = useState(null);
  const [isLoading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(...args);
      const result = res.data?.data ?? res.data;
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      if (mountedRef.current) {
        setError(msg);
        onError?.(msg);
      }
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
};

/**
 * Mutation hook (for POST/PUT/DELETE actions)
 */
export const useMutation = (mutationFn, options = {}) => {
  const { onSuccess, onError } = options;
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mutationFn(...args);
      const result = res.data?.data ?? res.data;
      onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      onError?.(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  return { mutate, isLoading, error };
};
