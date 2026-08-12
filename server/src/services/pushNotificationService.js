const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification to a single Expo push token.
 * @param {string} token - Expo push token (e.g., "ExponentPushToken[xxxx]")
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} [data={}] - Extra data payload (e.g., noticeId)
 * @returns {Promise<Object>} Expo API response
 */
const sendPushNotification = async (token, title, body, data = {}) => {
  if (!token || !token.startsWith('ExponentPushToken')) {
    return { success: false, error: 'Invalid Expo push token' };
  }

  try {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        badge: 1,
      }),
    });

    const result = await response.json();

    if (result.data && result.data.status === 'error') {
      console.error(`Push notification error for token ${token}:`, result.data.message);
      return { success: false, error: result.data.message };
    }

    return { success: true, result };
  } catch (error) {
    console.error('Push notification fetch error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications to multiple tokens in batches of 100.
 * @param {string[]} tokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} [data={}] - Extra data payload
 * @returns {Promise<Array>} Array of {token, success, error} results
 */
const sendBulkPushNotifications = async (tokens, title, body, data = {}) => {
  const BATCH_SIZE = 100;
  const validTokens = tokens.filter((t) => t && t.startsWith('ExponentPushToken'));
  const results = [];

  // Split into batches of 100
  for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
    const batch = validTokens.slice(i, i + BATCH_SIZE);

    const messages = batch.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      badge: 1,
    }));

    try {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const resultData = await response.json();
      const ticketResults = Array.isArray(resultData.data) ? resultData.data : [resultData.data];

      batch.forEach((token, idx) => {
        const ticket = ticketResults[idx];
        if (ticket && ticket.status === 'error') {
          results.push({ token, success: false, error: ticket.message });
        } else {
          results.push({ token, success: true });
        }
      });
    } catch (error) {
      console.error('Bulk push batch error:', error.message);
      batch.forEach((token) => {
        results.push({ token, success: false, error: error.message });
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  console.log(`📲 Push notifications: ${successCount} sent, ${failCount} failed`);

  return results;
};

module.exports = { sendPushNotification, sendBulkPushNotifications };
