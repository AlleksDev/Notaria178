import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, WifiOff, Wifi } from 'lucide-react';
import { useWorkComments } from '../hooks/useWorkComments';
import { ChatBubble } from './ChatBubble';

interface CommentsSectionProps {
  workId: string;
  lastReadMessageId?: string | null;
  onMarkAsRead?: (messageId: string) => void;
}

export const CommentsSection = ({ workId, lastReadMessageId, onMarkAsRead }: CommentsSectionProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { comments, isConnected, isLoading, error, sendComment, currentUserId, justSentMessage, clearJustSentMessage } =
    useWorkComments({ workId, enabled: true });

  // Referencia para rastrear mensajes al momento de montar
  const initialCommentsLengthRef = useRef<number>(0);

  // Guardar el length inicial cuando se cargan los comentarios por primera vez
  useEffect(() => {
    if (!isLoading && comments.length > 0 && initialCommentsLengthRef.current === 0) {
      initialCommentsLengthRef.current = comments.length;
    }
  }, [isLoading, comments.length]);

  // Encontrar índice del último mensaje leído para mostrar divisor
  const lastReadIndex = lastReadMessageId
    ? comments.findIndex(c => c.id === lastReadMessageId)
    : -1;

  // Solo mostrar divisor si hay mensajes no leídos de OTROS usuarios
  const hasUnreadMessages = lastReadIndex !== -1 && lastReadIndex < comments.length - 1 &&
    comments.slice(lastReadIndex + 1).some(c => c.user_id !== currentUserId);

  // Marcar como leído cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (comments.length > 0 && onMarkAsRead) {
        const lastMessage = comments[comments.length - 1];
        onMarkAsRead(lastMessage.id);
      }
    };
  }, [comments, onMarkAsRead]);

  // Marcar como leído los mensajes nuevos que llegan MIENTRAS estamos viendo el chat
  useEffect(() => {
    if (initialCommentsLengthRef.current > 0 && comments.length > initialCommentsLengthRef.current) {
      // Solo marcar los mensajes que llegaron DESPUÉS de montar el componente
      const newMessages = comments.slice(initialCommentsLengthRef.current);
      const hasNewMessagesFromOthers = newMessages.some(c => c.user_id !== currentUserId);

      if (hasNewMessagesFromOthers && onMarkAsRead) {
        const lastMessage = comments[comments.length - 1];
        onMarkAsRead(lastMessage.id);
      }
    }
  }, [comments.length, currentUserId, onMarkAsRead]);

  // Scroll inicial: ir al final cuando se cargan los comentarios por primera vez
  // Si hay mensajes no leídos, posicionar para que el divisor sea visible
  useEffect(() => {
    if (!isLoading && comments.length > 0 && messagesContainerRef.current) {
      if (hasUnreadMessages) {
        // Si hay mensajes no leídos, hacer scroll para mostrar el divisor
        // Timeout para asegurar que el DOM esté renderizado
        setTimeout(() => {
          const divider = messagesContainerRef.current?.querySelector('[data-unread-divider]') as HTMLElement;
          if (divider) {
            divider.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
        }, 100);
      } else {
        // Si no hay mensajes no leídos, ir al final
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [isLoading, comments.length, hasUnreadMessages]);

  // Auto scroll SOLO cuando el usuario envía un mensaje propio
  useEffect(() => {
    if (justSentMessage && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      clearJustSentMessage?.();
    }
  }, [justSentMessage, clearJustSentMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (sendComment(message)) {
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#740A03]" />
        </div>
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <WifiOff className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-500">{error}</p>
          <p className="text-xs text-gray-400">Intentando reconectar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header con estado de conexión */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Comentarios del expediente</h3>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <Wifi size={14} className="text-green-500" />
              <span className="text-xs text-green-600">En vivo</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-amber-500" />
              <span className="text-xs text-amber-600">Reconectando...</span>
            </>
          )}
        </div>
      </div>

      {/* Área de mensajes - scroll controlado dentro del contenedor */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">
              No hay comentarios. Sé el primero en comentar.
            </p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id}>
              <ChatBubble
                comment={comment}
                isOwn={comment.user_id === currentUserId}
              />
              {/* Divisor de comentarios nuevos */}
              {hasUnreadMessages && index === lastReadIndex && (
                <div className="flex items-center gap-3 my-4" data-unread-divider>
                  <div className="flex-1 h-px bg-red-400" />
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                    Comentarios nuevos
                  </span>
                  <div className="flex-1 h-px bg-red-400" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input de mensaje */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comentario..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#740A03]/20 focus:border-[#740A03] transition-all"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#740A03] text-white hover:bg-[#5c0802] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 px-1">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </p>
      </form>
    </div>
  );
};
