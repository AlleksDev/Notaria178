// src/hooks/useFCMListener.ts
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "../config/firebase";
import { useNotificationStore } from "../store/notificationStore";

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

export const useFCMListener = (
  onNewComment?: (comment: CommentData) => void,
  currentWorkId?: string
) => {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload: FCMPayload) => {
      console.log("[FCM] Mensaje recibido en primer plano:", payload);

      playNotificationSound();

      if ('Notification' in window && Notification.permission === 'granted') {
        if (payload.notification) {
          new Notification(payload.notification.title || "Nueva notificacion", {
            body: payload.notification.body || "",
            icon: "/logo.png",
            badge: "/badge.png",
          });
        }
      }

      if (payload.data) {
        const { click_action, work_id, comment } = payload.data;

        if (click_action === "WORK_DETAIL" && comment) {
          try {
            const commentData: CommentData = JSON.parse(comment);

            if (currentWorkId && work_id === currentWorkId && onNewComment) {
              console.log("[FCM] Inyectando comentario en tiempo real al trabajo actual");
              onNewComment(commentData);
            }

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

    return () => {
      unsubscribe();
    };
  }, [addNotification, onNewComment, currentWorkId]);
};
