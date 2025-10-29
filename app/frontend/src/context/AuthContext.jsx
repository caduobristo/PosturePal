import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { login as apiLogin, registerUser as apiRegister, fetchUser } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const STORAGE_KEY = 'posturepal:user';

  const defaultProfile = useMemo(
    () => ({
      avatar: '',
      level: 'Member',
      experience: 'New dancer',
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      streakDays: 0,
      joinDate: null,
    }),
    [],
  );

  const hydrateUser = useCallback(
    (rawUser) => {
      if (!rawUser) return null;
      return {
        ...defaultProfile,
        ...rawUser,
        joinDate: rawUser.joinDate || rawUser.created_at || defaultProfile.joinDate,
      };
    },
    [defaultProfile],
  );

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return hydrateUser(parsed);
    } catch (error) {
      console.error('Failed to parse stored user', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const persistUser = useCallback(
    (nextUser) => {
      if (nextUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    [STORAGE_KEY],
  );

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      if (email === 'admin@ballet.com' && password === 'admin') {
        const demoUser = hydrateUser({
          id: 'demo-user',
          name: 'Demo User',
          email: 'admin@ballet.com',
          created_at: new Date().toISOString(),
          avatar:
            'https://images.unsplash.com/photo-1675806528444-75a88ed9c014?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          level: 'Intermediate',
          experience: 'Demo account',
          totalSessions: 0,
          averageScore: 0,
          bestScore: 0,
          streakDays: 0,
        });
        setUser(demoUser);
        persistUser(demoUser);
        return { success: true, demo: true };
      }

      const response = await apiLogin(email, password);
      const hydratedUser = hydrateUser(response);
      setUser(hydratedUser);
      persistUser(hydratedUser);
      return { success: true };
    } catch (error) {
      let message = error?.data?.detail || error?.message || 'Unable to sign in at the moment.';
      if (Array.isArray(message)) {
        message = message
          .map((item) => item?.msg || item?.message || JSON.stringify(item))
          .join(', ');
      }
      if (typeof message !== 'string') {
        message = String(message);
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [hydrateUser, persistUser]);

  const register = useCallback(
    async ({ name, email, password }) => {
      setLoading(true);
      try {
        if (email === 'admin@ballet.com') {
          throw new Error('Demo account already exists. Please use another email.');
        }
        const response = await apiRegister({ name, email, password });
        const hydratedUser = hydrateUser(response);
        setUser(hydratedUser);
        persistUser(hydratedUser);
        return { success: true };
      } catch (error) {
        let message = error?.data?.detail || error?.message || 'Unable to sign up right now.';
        if (Array.isArray(message)) {
          message = message
            .map((item) => item?.msg || item?.message || JSON.stringify(item))
            .join(', ');
        }
        if (typeof message !== 'string') {
          message = String(message);
        }
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [hydrateUser, persistUser],
  );

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const latest = await fetchUser(user.id);
      const hydratedUser = hydrateUser(latest);
      setUser(hydratedUser);
      persistUser(hydratedUser);
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  }, [hydrateUser, persistUser, user?.id]);

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
  }, [persistUser]);

  const updateProfile = useCallback(
    (updates) => {
      setUser((prev) => {
        if (!prev) return prev;
        const merged = hydrateUser({ ...prev, ...updates });
        persistUser(merged);
        return merged;
      });
    },
    [hydrateUser, persistUser],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      register,
      refreshUser,
      updateProfile,
    }),
    [login, logout, register, refreshUser, updateProfile, user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
