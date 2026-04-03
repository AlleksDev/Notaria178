import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import type { WorkComment, WSMessage, CommentPayload, WSErrorPayload } from '../types';

const WS_BASE_URL = 'ws://localhost:8080';

interface UseWorkCommentsOptions {
  workId: string | null;
  enabled?: boolean;
  onNewComment?: (comment: WorkComment, isOwnMessage: boolean) => void;
}

export const useWorkComments = ({ workId, enabled = true, onNewComment }: UseWorkCommentsOptions) => {
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justSentMessage, setJustSentMessage] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onNewCommentRef = useRef(onNewComment);
  const { token, user } = useAuthStore();

  // Mantener el ref actualizado sin causar reconexiones
  useEffect(() => {
    onNewCommentRef.current = onNewComment;
  }, [onNewComment]);

  const connect = useCallback(() => {
    if (!workId || !token || !enabled) return;

    // Limpiar conexión previa si existe
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_BASE_URL}/ws/comments?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);

      // Unirse a la sala del trabajo
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

        switch (message.type) {
          case 'history':
            setComments(message.payload as WorkComment[]);
            setIsLoading(false);
            break;

          case 'comment': {
            const newComment = message.payload as CommentPayload;
            const isOwnMessage = newComment.user_id === user?.id;

            // Si es nuestro mensaje, buscar y reemplazar el optimista
            if (isOwnMessage) {
              setComments((prev) => {
                // Buscar mensaje temporal con el mismo contenido enviado recientemente
                const optimisticIndex = prev.findIndex(
                  (c) =>
                    c.id.startsWith('temp-') &&
                    c.user_id === newComment.user_id &&
                    c.message === newComment.message
                );

                if (optimisticIndex !== -1) {
                  // Reemplazar el mensaje temporal con el real
                  const updated = [...prev];
                  updated[optimisticIndex] = newComment;
                  return updated;
                }

                // Si no se encontró optimista, agregar normalmente
                return [...prev, newComment];
              });

              setJustSentMessage(true);
            } else {
              // Mensaje de otro usuario, agregar normalmente
              setComments((prev) => [...prev, newComment]);
            }

            // Notificar al padre con info de si es mensaje propio
            onNewCommentRef.current?.(newComment, isOwnMessage);
            break;
          }

          case 'error': {
            const errPayload = message.payload as WSErrorPayload;
            setError(errPayload.error);
            setIsLoading(false);
            break;
          }
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconexión automática
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      setError('Error de conexión');
      setIsConnected(false);
    };
  }, [workId, token, enabled, user?.id]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      // Abandonar sala antes de cerrar
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

  const sendComment = useCallback(
    (message: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !workId || !user) {
        return false;
      }

      // Optimistic update: agregar mensaje inmediatamente (como WhatsApp)
      const optimisticComment: WorkComment = {
        id: `temp-${Date.now()}`, // ID temporal
        work_id: workId,
        user_id: user.id,
        user_name: user.full_name,
        message: message.trim(),
        created_at: new Date().toISOString(),
      };

      setComments((prev) => [...prev, optimisticComment]);
      setJustSentMessage(true);

      // Enviar al servidor (cuando llegue el real, reemplazará el optimista)
      wsRef.current.send(
        JSON.stringify({
          type: 'comment',
          payload: {
            work_id: workId,
            message: message.trim(),
          },
        })
      );

      return true;
    },
    [workId, user]
  );

  const clearJustSentMessage = useCallback(() => {
    setJustSentMessage(false);
  }, []);

  useEffect(() => {
    if (enabled && workId) {
      setIsLoading(true);
      setComments([]);
      connect();
    }

    return () => {
      disconnect();
    };
  }, [workId, enabled, connect, disconnect]);

  return {
    comments,
    isConnected,
    isLoading,
    error,
    sendComment,
    currentUserId: user?.id,
    justSentMessage,
    clearJustSentMessage,
  };
};
