import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
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
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
              isLoading
                ? 'bg-[#C07D30]/70 cursor-wait'
                : 'bg-[#C07D30] hover:bg-[#A86925]'
            }`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
