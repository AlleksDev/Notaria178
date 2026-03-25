import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useNotificationStore } from '../../../store/notificationStore';
import type { WorkComment, WSMessage, CommentPayload, WSErrorPayload } from '../types';

const WS_BASE_URL = 'ws://localhost:8080';

interface UseCommentNotificationsOptions {
  workId: string | null;
  enabled?: boolean;
  onNewComment?: (comment: WorkComment, isOwnMessage: boolean) => void;
}

export const useCommentNotifications = ({ workId, enabled = true, onNewComment }: UseCommentNotificationsOptions) => {
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onNewCommentRef = useRef(onNewComment);
  const { token, user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    onNewCommentRef.current = onNewComment;
  }, [onNewComment]);

  const connect = useCallback(() => {
    if (!workId || !token || !enabled) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_BASE_URL}/ws/comments?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);

      ws.send(
        JSON.stringify({
          type: 'join_room',
          payload: { work_id: workId },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        if (message.type === 'comment') {
          const newComment = message.payload as CommentPayload;
          const isOwnMessage = newComment.user_id === user?.id;

          if (!isOwnMessage) {
            addNotification({
              id: newComment.id,
              user_id: newComment.user_id,
              work_id: workId,
              type: 'NEW_COMMENT',
              title: 'Nuevo comentario',
              message: `${newComment.full_name || 'Usuario'} comento: ${newComment.content}`,
              is_read: false,
              created_at: newComment.created_at,
            });
          }

          onNewCommentRef.current?.(newComment, isOwnMessage);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, [workId, token, enabled, user?.id, addNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      if (workId && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'leave_room',
            payload: { work_id: workId },
          })
        );
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [workId]);

  useEffect(() => {
    if (enabled && workId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [workId, enabled, connect, disconnect]);

  return { isConnected };
};
