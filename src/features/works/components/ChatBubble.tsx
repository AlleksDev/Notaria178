import type { WorkComment } from '../types';

interface ChatBubbleProps {
  comment: WorkComment;
  isOwn: boolean;
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}min`;
  if (diffHr < 24) return `hace ${diffHr}h`;
  if (diffDay === 1) return 'ayer';
  if (diffDay < 7) return `hace ${diffDay} días`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

export const ChatBubble = ({ comment, isOwn }: ChatBubbleProps) => {
  const timeAgo = formatRelativeTime(comment.created_at);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? 'bg-[#740A03] text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-semibold text-[#740A03] mb-1">{comment.user_name}</p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.message}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
          {timeAgo}
        </p>
      </div>
    </div>
  );
};
