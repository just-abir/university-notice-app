import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/api';
import { setupNotificationListeners } from '@/services/pushNotifications';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  const { setAuth, setLoading, loadStoredTokens } = useAuthStore();

  useEffect(() => {
    // Restore auth session on app start
    const restoreSession = async () => {
      setLoading(true);
      try {
        const { accessToken } = await loadStoredTokens();
        if (accessToken) {
          const data = await authAPI.getMe();
          await setAuth(data.user, accessToken);
        }
      } catch {
        // Token expired or invalid – user will be redirected to login
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Setup push notification listeners
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification.request.content.title);
      },
      (response) => {
        // Handle notification tap — navigate to notice
        const noticeId = response.notification.request.content.data?.noticeId;
        if (noticeId) {
          console.log('Navigate to notice:', noticeId);
          // Navigation is handled per-tab in the tab layouts
        }
      }
    );

    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(student)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
