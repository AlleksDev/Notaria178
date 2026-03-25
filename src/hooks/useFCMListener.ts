// src/hooks/useFCMListener.ts
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "../config/firebase";
import { useNotificationStore } from "../store/notificationStore";

// Sonido de notificacion (reemplazar con tu propio archivo de audio)
const playNotificationSound = () => {
  const audio = new Audio("/notification-sound.mp3");
  audio.volume = 0.5;
  audio.play().catch((err) => console.error("Error reproduciendo sonido:", err));
};

interface CommentData {
  type: string;
  work_id: string;
  comment_id: string;
  comment_author: string;
  author_name: string;
  message: string;
  created_at: string;
}

interface FCMPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    click_action?: string;
    work_id?: string;
    comment?: string;
  };
}

/**
 * Hook para escuchar notificaciones FCM en primer plano (foreground).
 *
 * @param onNewComment - Callback opcional que se ejecuta cuando llega un nuevo comentario
 * @param currentWorkId - ID del trabajo actual (para saber si inyectar el comentario)
 */
export const useFCMListener = (
  onNewComment?: (comment: CommentData) => void,
  currentWorkId?: string
) => {
  const { incrementUnreadCount, addNotification } = useNotificationStore();

  useEffect(() => {
    // Escuchar mensajes cuando la app esta en primer plano
    const unsubscribe = onMessage(messaging, (payload: FCMPayload) => {
      console.log("[FCM] Mensaje recibido en primer plano:", payload);

      // 1. Reproducir sonido de notificacion
      playNotificationSound();

      // 2. Incrementar el contador de no leidas
      incrementUnreadCount();

      // 3. Mostrar notificacion del navegador (opcional)
      if (payload.notification) {
        new Notification(payload.notification.title || "Nueva notificacion", {
          body: payload.notification.body || "",
          icon: "/logo.png",
          badge: "/badge.png",
        });
      }

      // 4. Procesar el data payload
      if (payload.data) {
        const { click_action, work_id, comment } = payload.data;

        // Si es un comentario nuevo
        if (click_action === "WORK_DETAIL" && comment) {
          try {
            const commentData: CommentData = JSON.parse(comment);

            // 5. Si el usuario esta viendo el trabajo relacionado, inyectar el comentario
            if (currentWorkId && work_id === currentWorkId && onNewComment) {
              console.log("[FCM] Inyectando comentario en tiempo real al trabajo actual");
              onNewComment(commentData);
            }

            // 6. Agregar notificacion al store (para la lista de notificaciones)
            addNotification({
              id: commentData.comment_id,
              user_id: commentData.comment_author,
              work_id: work_id,
              type: "NEW_COMMENT",
              title: payload.notification?.title,
              body: payload.notification?.body,
              message: `${commentData.author_name} comento: ${commentData.message}`,
              is_read: false,
              created_at: commentData.created_at,
            });
          } catch (error) {
            console.error("[FCM] Error parseando data payload del comentario:", error);
          }
        }
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [incrementUnreadCount, addNotification, onNewComment, currentWorkId]);
};
