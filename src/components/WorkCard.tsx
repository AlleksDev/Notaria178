import { Calendar, User } from 'lucide-react';
import type { WorkStatus, WorkActInfo, WorkCollaborator } from '../features/works/types';

const WORK_LOGO = '/work.svg';

interface WorkCardProps {
  folio?: string;
  status: WorkStatus;
  createdAt: string;
  acts?: WorkActInfo[];
  collaborators?: WorkCollaborator[];
  mainDrafterId?: string;
  mainDrafterName?: string;
  clientName?: string;
  isLoadingDetail?: boolean;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<
  WorkStatus,
  { label: string; bg: string; text: string }
> = {
  APPROVED: {
    label: 'Aprobado',
    bg: 'bg-badge-approved-bg',
    text: 'text-badge-approved-text',
  },
  PENDING: {
    label: 'Pendiente',
    bg: 'bg-badge-pending-bg',
    text: 'text-badge-pending-text',
  },
  READY_FOR_REVIEW: {
    label: 'Listo para revisión',
    bg: 'bg-badge-review-bg',
    text: 'text-badge-review-text',
  },
  IN_PROGRESS: {
    label: 'En proceso',
    bg: 'bg-badge-process-bg',
    text: 'text-badge-process-text',
  },
  REJECTED: {
    label: 'Rechazado',
    bg: 'bg-badge-rejected-bg',
    text: 'text-badge-rejected-text',
  },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const WorkCard = ({
  folio,
  status,
  createdAt,
  acts,
  collaborators,
  mainDrafterId,
  mainDrafterName,
  clientName,
  isLoadingDetail,
  onClick,
}: WorkCardProps) => {
  const statusCfg = STATUS_CONFIG[status];

  const drafterName =
    mainDrafterName ??
    (mainDrafterId
      ? collaborators?.find((c) => c.user_id === mainDrafterId)?.full_name
      : undefined) ??
    'Carlos Ramírez';

  const resolvedClientName = clientName || 'Juan Pérez';

  const actNames = acts?.map((a) => a.name).join(' - ');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-[#D4D4D4] hover:shadow-md transition-shadow cursor-pointer flex flex-col overflow-hidden"
      style={{ maxWidth: 348, minHeight: 358 }}
    >
      {/* Logo — work.svg from public */}
      <div className="flex items-center justify-center border-b border-[#D4D4D4]">
        <img
          src={WORK_LOGO}
          alt="Notaría 178"
          className="w-full object-contain"
          style={{ maxHeight: 200 }}
        />
      </div>

      {/* Content area with gap-[10px] per Figma */}
      <div className="flex flex-col gap-[10px] px-4 pt-3 pb-4 flex-1">
        {/* Status + date row */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
          >
            {statusCfg.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} />
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Folio */}
        <p className="text-sm font-bold text-gray-800">
          {folio ? `Escritura No. ${folio}` : 'Sin folio'}
        </p>

        {isLoadingDetail ? (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-3.5 bg-gray-100 rounded w-3/4" />
            <div className="h-3.5 bg-gray-100 rounded w-2/3" />
          </div>
        ) : (
          <>
            {/* Client */}
            <p className="text-xs text-gray-500">
              Cliente:{' '}
              <span className="font-semibold text-[#740A03]">
                {resolvedClientName}
              </span>
            </p>

            {/* Acts */}
            <p className="text-xs text-gray-400 line-clamp-1">
              Actos: {actNames || '—'}
            </p>
          </>
        )}

        {/* Drafter at bottom */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
          <User size={13} className="text-[#740A03]" />
          <span className="truncate font-medium">
            {`Lic. ${drafterName}`}
          </span>
        </div>
      </div>
    </div>
  );
};
