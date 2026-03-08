import React, { useState } from 'react';
import {
  FileText,
  Pencil,
  Trash2,
  CheckSquare,
  XSquare,
  Plus,
  Loader2,
} from 'lucide-react';
import type { Act, ActRequirement } from '../types';
import { getActRequirements, addActRequirement, deleteActRequirement } from '../api';
import { ConfirmModal } from '../../../components/ConfirmModal';

interface ActListItemProps {
  act: Act;
  onEdit?: (act: Act) => void;
  onDelete?: (act: Act) => void;
}

export const ActListItem: React.FC<ActListItemProps> = ({ act, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [requirements, setRequirements] = useState<ActRequirement[]>([]);
  const [isLoadingReqs, setIsLoadingReqs] = useState(false);
  const [newReqName, setNewReqName] = useState('');
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [reqCount, setReqCount] = useState(act.requirements_count);

  // Confirm modal state for requirement deletion
  const [reqToDelete, setReqToDelete] = useState<ActRequirement | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Status UI helper
  const isActActive = act.status === 'ACTIVE';

  const toggleExpand = async () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && requirements.length === 0) {
      fetchRequirements();
    }
  };

  const fetchRequirements = async () => {
    try {
      setIsLoadingReqs(true);
      const data = await getActRequirements(act.id);
      setRequirements(data);
    } catch (err) {
      console.error('Failed to load requirements', err);
    } finally {
      setIsLoadingReqs(false);
    }
  };

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqName.trim()) return;

    try {
      setIsAddingReq(true);
      const newReq = await addActRequirement(act.id, newReqName.trim());
      setRequirements((prev) => [...prev, newReq]);
      setReqCount((c) => c + 1);
      setNewReqName('');
    } catch (err) {
      console.error('Failed to add requirement', err);
    } finally {
      setIsAddingReq(false);
    }
  };

  // Opens the ConfirmModal for the given requirement
  const handleRequestDeleteReq = (req: ActRequirement) => {
    setReqToDelete(req);
  };

  // Executes the safe-delete action (backend decides deactivate or physical delete)
  const handleConfirmDeleteReq = async () => {
    if (!reqToDelete) return;
    setIsConfirmLoading(true);
    try {
      const { soft_deleted } = await deleteActRequirement(act.id, reqToDelete.id);
      if (soft_deleted) {
        // Mark the requirement as INACTIVE in local state
        setRequirements((prev) =>
          prev.map((r) =>
            r.id === reqToDelete.id ? { ...r, status: 'INACTIVE' } : r
          )
        );
      } else {
        // Remove from local state (physical delete)
        setRequirements((prev) => prev.filter((r) => r.id !== reqToDelete.id));
        setReqCount((c) => Math.max(0, c - 1));
      }
      setReqToDelete(null);
    } catch (err) {
      console.error('Failed to delete requirement', err);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  // Computed confirm modal props based on works_count
  const confirmTitle = act.works_count > 0 ? 'Desactivar requisito' : 'Eliminar requisito';
  const confirmMessage = act.works_count > 0
    ? `Este requisito pertenece a un acto con ${act.works_count} ${act.works_count === 1 ? 'trabajo vinculado' : 'trabajos vinculados'}. ¿Deseas desactivarlo para que no se pida en futuros trámites?`
    : '¿Estás seguro de eliminar este requisito permanentemente? Esta acción no se puede deshacer.';
  const confirmLabel = act.works_count > 0 ? 'Desactivar' : 'Eliminar';
  const confirmVariant: 'danger' | 'warning' = act.works_count > 0 ? 'warning' : 'danger';

  // Count active-only requirements for display
  const activeReqCount = requirements.length > 0
    ? requirements.filter((r) => r.status === 'ACTIVE').length
    : reqCount;

  return (
    <div className="flex flex-col">
      {/* Principal Row  */}
      <div 
        onClick={toggleExpand}
        className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors gap-3 sm:gap-0 group"
      >
        {/* Left: Name and Icon */}
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-red-800 flex-shrink-0" strokeWidth={1.5} />
          <h4 className="text-gray-700 font-medium text-sm sm:text-base">
            {act.name}
          </h4>
          <span 
            className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border ${
              isActActive 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {isActActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Right: Metrics and Actions */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pl-8 sm:pl-0">
          <span className="hidden sm:inline-block">
            {activeReqCount} {activeReqCount === 1 ? 'requisito' : 'requisitos'}
          </span>
          <span className="hidden sm:inline-block">
            {act.works_count} {act.works_count === 1 ? 'trabajo' : 'trabajos'}
          </span>

          <div className="flex items-center gap-3 ml-2 sm:ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(act);
              }}
              className="text-gray-400 hover:text-gray-700 transition"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(act);
              }}
              className="text-gray-400 hover:text-red-500 transition"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Sub-panel: Requirements */}
      {isExpanded && (
        <div className="bg-gray-50/50 px-6 py-5 border-t border-gray-100 flex flex-col gap-4">
          {act.description ? (
            <p className="text-sm text-gray-500 italic mb-0">{act.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic mb-0">Sin descripción por el momento.</p>
          )}
          <h5 className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider uppercase">
            Checklist de Requisitos
          </h5>

          {isLoadingReqs ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {requirements.map((req) => {
                const isInactive = req.status === 'INACTIVE';
                return (
                  <div 
                    key={req.id} 
                    className={`bg-white border rounded-lg p-3 flex items-start gap-3 shadow-sm group/req transition-opacity ${
                      isInactive ? 'opacity-50 border-gray-300' : 'border-gray-200'
                    }`}
                  >
                    {isInactive ? (
                      <XSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    ) : (
                      <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    )}
                    <span className={`text-sm flex-1 leading-snug ${
                      isInactive ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}>
                      {req.name}
                    </span>
                    
                    {isInactive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 font-medium whitespace-nowrap">
                        Inactivo
                      </span>
                    ) : (
                      /* Delete requirement button (shows on hover) */
                      <button 
                        onClick={() => handleRequestDeleteReq(req)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover/req:opacity-100 transition-opacity"
                        title="Eliminar requisito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add New Requirement Inline Form */}
              <form 
                onSubmit={handleAddRequirement} 
                className="bg-white border border-gray-200 border-dashed rounded-lg p-2.5 flex items-center shadow-sm"
              >
                <div className="text-gray-400 mr-2 ml-1">
                  {isAddingReq ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-800" />
                  ) : (
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </div>
                <input 
                  type="text"
                  value={newReqName}
                  onChange={(e) => setNewReqName(e.target.value)}
                  placeholder="Agregar requisito..."
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none border-none py-0.5 min-w-[120px]"
                  disabled={isAddingReq}
                />
                {newReqName.trim() && (
                  <button 
                    type="submit" 
                    className="ml-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition"
                    disabled={isAddingReq}
                  >
                    Guardar
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal for Requirements */}
      <ConfirmModal
        isOpen={!!reqToDelete}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        variant={confirmVariant}
        isLoading={isConfirmLoading}
        onConfirm={handleConfirmDeleteReq}
        onCancel={() => setReqToDelete(null)}
      />
    </div>
  );
};
