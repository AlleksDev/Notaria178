importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuracion de Firebase para notificaciones push
firebase.initializeApp({
  apiKey: "AIzaSyDIz68-fhGSXfnYWyF2LmscrZ56qYIQ1io",
  authDomain: "notaria178-app.firebaseapp.com",
  projectId: "notaria178-app",
  storageBucket: "notaria178-app.firebasestorage.app",
  messagingSenderId: "295585315794",
  appId: "1:295585315794:web:469fc1223a0d6fda56e60b"
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano (background)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificacion recibida en segundo plano:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva notificacion';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/notaria178.svg',
    badge: '/n.svg',
    data: payload.data // Pasar el data payload a la notificacion
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clic en la notificacion
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificacion clickeada:', event.notification);

  event.notification.close();

  // Abrir la aplicacion cuando se hace clic en la notificacion
  const workId = event.notification.data?.work_id;
  const urlToOpen = workId
    ? `${self.location.origin}/works/${workId}`
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Enviar mensaje al cliente para navegar al trabajo
            if (workId) {
              client.postMessage({
                type: 'NAVIGATE_TO_WORK',
                workId: workId
              });
            }
          });
        }
      }
      // Si no, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
