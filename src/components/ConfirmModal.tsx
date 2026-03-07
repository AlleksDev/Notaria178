import { X, Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  isOpen,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const confirmBtn =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
      : 'bg-primary hover:bg-primary-hover disabled:bg-primary/60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {variant !== 'default' && (
                <div
                  className={`p-2 rounded-full ${
                    variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      variant === 'danger' ? 'text-red-600' : 'text-amber-600'
                    }`}
                  />
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            </div>
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

        <div className="flex gap-4 px-8 pb-8">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider text-white rounded-lg transition-colors cursor-pointer disabled:cursor-wait ${confirmBtn}`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
