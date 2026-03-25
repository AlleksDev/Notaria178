import { getToken } from "firebase/messaging";
import { messaging } from "../config/firebase";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const usePushNotifications = () => {
  const requestPermissionAndGetToken = async () => {
    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        console.log("[FCM] Permiso de notificaciones concedido");

        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        if (currentToken) {
          console.log("[FCM] Token obtenido:", currentToken.substring(0, 20) + "...");

          // Registrar el token en el backend
          await registerTokenInBackend(currentToken);

          return currentToken;
        } else {
          console.warn("[FCM] No se pudo obtener el token FCM");
        }
      } else {
        console.warn("[FCM] El usuario denego el permiso para notificaciones");
      }
    } catch (error) {
      console.error("[FCM] Error al obtener token FCM:", error);
    }
  };

  const registerTokenInBackend = async (fcmToken: string) => {
    try {
      const token = localStorage.getItem("notaria-auth");
      if (!token) {
        console.warn("[FCM] No hay token de autenticacion, no se puede registrar FCM token");
        return;
      }

      // Parsear el token de localStorage (Zustand persist)
      const authData = JSON.parse(token);
      const jwtToken = authData?.state?.token;

      if (!jwtToken) {
        console.warn("[FCM] No se encontro JWT token en authStore");
        return;
      }

      await axios.put(
        `${API_URL}/notifications/device-token`,
        {
          fcm_token: fcmToken,
          device_type: "web"
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        }
      );

      console.log("[FCM] Token registrado exitosamente en el backend");
    } catch (error) {
      console.error("[FCM] Error registrando token en backend:", error);
    }
  };

  return { requestPermissionAndGetToken };
};
