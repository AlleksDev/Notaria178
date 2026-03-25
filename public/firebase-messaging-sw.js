importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
// tranquilo, esto es solo para el servicio de mensajería, no expone nada más de la aplicación
// o sea no es secreto, es solo para saber a qué proyecto de Firebase conectarse para recibir las notificaciones push
firebase.initializeApp({
  apiKey: "AIzaSyDIz68-fhGSXfnYWyF2LmscrZ56qYIQ1io",
  authDomain: "notaria178-app.firebaseapp.com",
  projectId: "notaria178-app",
  storageBucket: "notaria178-app.firebasestorage.app",
  messagingSenderId: "295585315794",
  appId: "1:295585315794:web:469fc1223a0d6fda56e60b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje en segundo plano recibido ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});