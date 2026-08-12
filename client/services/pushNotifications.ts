import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and return the Expo push token.
 * Returns null if permissions denied or not on a physical device.
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cse-notices', {
      name: 'CSE Notices',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
      sound: 'default',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Will use app.json EAS projectId if available
    });
    return tokenData.data;
  } catch (error) {
    console.warn('Failed to get Expo push token:', error);
    return null;
  }
};

/**
 * Set up foreground and background notification listeners.
 * Returns a cleanup function.
 */
export const setupNotificationListeners = (
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void
): (() => void) => {
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📲 Foreground notification:', notification.request.content.title);
    onNotification?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('📲 Notification tapped:', response.notification.request.content.data);
    onResponse?.(response);
  });

  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
};

/**
 * Schedule a local notification (for testing purposes)
 */
export const scheduleLocalNotification = async (title: string, body: string, data?: object) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: true },
    trigger: null, // Show immediately
  });
};
