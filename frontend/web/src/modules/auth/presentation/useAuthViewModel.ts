import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '../domain/User';
import { HttpAuthRepository } from '../infrastructure/HttpAuthRepository';
import { defaultHttpClient } from '../../../core/http/HttpClient';
import { LoginUseCase } from '../application/LoginUseCase';
import { RegisterUseCase } from '../application/RegisterUseCase';
import { GetCurrentUserUseCase } from '../application/GetCurrentUserUseCase';
import { TokenStorage } from '../../../core/storage/TokenStorage';

export const useAuthViewModel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Instantiating Use Cases within module scope
  const { loginUseCase, registerUseCase, getCurrentUserUseCase } = useMemo(() => {
    const repo = new HttpAuthRepository(defaultHttpClient);
    return {
      loginUseCase: new LoginUseCase(repo),
      registerUseCase: new RegisterUseCase(repo),
      getCurrentUserUseCase: new GetCurrentUserUseCase(repo),
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const token = TokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      const currentUser = await getCurrentUserUseCase.execute();
      setUser(currentUser);
      setError(null);
    } catch {
      setUser(null);
      TokenStorage.clear();
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserUseCase]);

  useEffect(() => {
    refreshUser();

    const onAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('nexpay_auth_logout', onAuthLogout);
    return () => window.removeEventListener('nexpay_auth_logout', onAuthLogout);
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      await loginUseCase.execute(credentials);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: { email: string; password: string; fullName: string }) => {
    try {
      setLoading(true);
      setError(null);
      await registerUseCase.execute(payload);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    TokenStorage.clear();
    setUser(null);
    window.dispatchEvent(new Event('nexpay_auth_logout'));
  };

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError: () => setError(null),
  };
};

