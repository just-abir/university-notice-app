import { useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/api';

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, isLoading, setAuth, logout, setLoading, loadStoredTokens } =
    useAuthStore();

  // Restore session from secure storage on mount
  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        const { accessToken: storedToken } = await loadStoredTokens();
        if (!storedToken) {
          setLoading(false);
          return;
        }

        // Verify token by fetching current user
        const data = await authAPI.getMe();
        await setAuth(data.user, storedToken);
      } catch (error) {
        // Token invalid or expired — will be handled by api interceptor
        setLoading(false);
      }
    };

    if (!isAuthenticated) {
      restoreSession();
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authAPI.login(email, password);
      await setAuth(data.user, data.accessToken, data.refreshToken);

      // Redirect based on role
      if (data.user.mustChangePassword) {
        router.replace('/(auth)/change-password');
      } else if (data.user.role === 'TEACHER') {
        router.replace('/(teacher)/');
      } else if (data.user.role === 'STUDENT') {
        router.replace('/(student)/');
      }
    },
    [setAuth]
  );

  const logoutUser = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout API errors
    }
    await logout();
    router.replace('/(auth)/login');
  }, [logout]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout: logoutUser,
  };
};
