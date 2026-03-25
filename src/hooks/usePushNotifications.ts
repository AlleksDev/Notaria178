import { getToken } from "firebase/messaging";
import { messaging } from "../config/firebase";

export const usePushNotifications = () => {
  const requestPermissionAndGetToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("¡Permiso concedido por el usuario!");
        
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        if (currentToken) {
          console.log("¡FCM Token obtenido exitosamente!:", currentToken);
          // TODO: Aquí debes hacer un POST/PUT a tu API en Go para guardar este token 
          // en la base de datos, en la fila de este usuario.
          return currentToken;
        } else {
          console.log("No se pudo obtener el token de registro.");
        }
      } else {
        console.warn("El usuario denegó el permiso para las notificaciones.");
      }
    } catch (error) {
      console.error("Error al obtener el token o pedir permiso:", error);
    }
  };

  return { requestPermissionAndGetToken };
};