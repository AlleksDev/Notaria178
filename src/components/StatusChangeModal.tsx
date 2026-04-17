import { X, Loader2 } from 'lucide-react';

interface StatusChangeModalProps {
  isOpen: boolean;
  /** Action keyword shown in italic primary text, e.g. "Aprobar", "Rechazar" */
  actionWord: string;
  /** Descriptive message shown below the title */
  message: string;
  /** Label shown inside the confirm button */
  confirmLabel: string;
  /** Whether an async action is in progress */
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StatusChangeModal = ({
  isOpen,
  actionWord,
  message,
  confirmLabel,
  isLoading = false,
  onConfirm,
  onCancel,
}: StatusChangeModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Confirmar{' '}
              <span className="italic text-primary">{actionWord}</span>
            </h2>
            <button
              onClick={onCancel}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="w-12 h-1 bg-primary mt-3" />
        </div>

        <div className="px-8 pt-5 pb-6">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 px-8 pb-8">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
