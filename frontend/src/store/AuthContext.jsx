import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'CLEAR_USER' });
      return;
    }
    try {
      const { data } = await authApi.me();
      dispatch({ type: 'SET_USER', payload: data.data.user });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'CLEAR_USER' });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    dispatch({ type: 'SET_USER', payload: user });
    return user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    dispatch({ type: 'SET_USER', payload: user });
    return user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await authApi.logout({ refreshToken }); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'CLEAR_USER' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
