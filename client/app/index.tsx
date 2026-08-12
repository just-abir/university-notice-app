import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={40} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.mustChangePassword) {
    return <Redirect href="/(auth)/change-password" />;
  }

  if (user?.role === 'TEACHER') {
    return <Redirect href="/(teacher)/" />;
  }

  if (user?.role === 'STUDENT') {
    return <Redirect href="/(student)/" />;
  }

  // Admin or unknown — send to login for now
  return <Redirect href="/(auth)/login" />;
}
