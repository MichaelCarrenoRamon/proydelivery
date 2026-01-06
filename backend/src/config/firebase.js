/*const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const sendPushNotification = async (token, notification) => {
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      token: token
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notificación enviada:', response);
    return response;
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    throw error;
  }
};

const sendMulticastNotification = async (tokens, notification) => {
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ ${response.successCount} notificaciones enviadas`);
    return response;
  } catch (error) {
    console.error('❌ Error enviando notificaciones:', error);
    throw error;
  }
};

module.exports = { 
  admin, 
  sendPushNotification, 
  sendMulticastNotification 
};*/