import React, { useState, useEffect } from 'react';
import { X, Loader2, FolderOpen, AlignLeft, Plus } from 'lucide-react';
import { isAxiosError } from 'axios';
import { createAct, updateAct } from '../api';
import type { CreateActRequest, Act } from '../types';

interface ActFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCategories: string[];
  editingAct?: Act | null; // If provided, we're in edit mode
}

export const ActFormModal: React.FC<ActFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCategories,
  editingAct,
}) => {
  /* ── Form state ── */
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  /* ── UI state ── */
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const isEditMode = !!editingAct;

  // Populate form when editing
  useEffect(() => {
    if (editingAct) {
      setName(editingAct.name);
      setCategory(editingAct.category || '');
      setDescription(editingAct.description || '');
      // If the category is not in existing list, enter creation mode
      if (editingAct.category && !existingCategories.includes(editingAct.category)) {
        setIsCreatingCategory(true);
      } else {
        setIsCreatingCategory(false);
      }
    }
  }, [editingAct, existingCategories]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = 'Este campo es obligatorio';
    if (!category.trim()) e.category = 'Este campo es obligatorio';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearField = (field: string) => {
    if (errors[field]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isEditMode && editingAct) {
        // PATCH update
        await updateAct(editingAct.id, {
          name: name.trim(),
          category: category.trim(),
          description: description.trim() || undefined,
        });
      } else {
        // POST create
        const req: CreateActRequest = {
          name: name.trim(),
          category: category.trim(),
        };
        if (description.trim()) {
          req.description = description.trim();
        }
        await createAct(req);
      }
      
      resetForm();
      onSuccess();
    } catch (err) {
      if (isAxiosError(err)) {
        setApiError(err.response?.data?.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} el acto`);
      } else {
        setApiError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setIsCreatingCategory(false);
    setErrors({});
    setApiError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inputBase =
    'w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors';
  const inputOk = 'border-gray-300 focus:border-red-800';
  const inputErr = 'border-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Editar' : 'Agregar'}{' '}
              <span className="italic text-red-800">Acto Legal</span>
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <div className="w-12 h-1 bg-red-800 rounded-full" />
            <div className="flex-1 h-1 bg-gray-200 rounded-full" />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5">
          <p className="text-sm text-gray-500 mb-1">
            {isEditMode
              ? 'Modifica las propiedades del acto seleccionado.'
              : 'Define las propiedades del nuevo acto en el sistema.'}
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Los campos con asterisco{' '}
            <span className="text-red-500 font-bold">*</span> son obligatorios.
          </p>

          {apiError && (
            <div className="p-3 mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {apiError}
            </div>
          )}

          <div className="flex flex-col gap-6">
            {/* Act Name */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Nombre del Acto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearField('name');
                }}
                className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
                placeholder="Ej. Acta Constitutiva..."
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Category Toggle (Select / Create) */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                <FolderOpen className="w-4 h-4 text-gray-400" />
                Categoría <span className="text-red-500">*</span>
              </label>
              
              {!isCreatingCategory ? (
                <div className="flex flex-col gap-3">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      clearField('category');
                    }}
                    className={`${inputBase} ${errors.category ? inputErr : inputOk} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled>Selecciona una categoría existente...</option>
                    {existingCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(true);
                      setCategory('');
                      clearField('category');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gold rounded-lg text-gold hover:bg-gold/5 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Crear nueva categoría
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 relative">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      clearField('category');
                    }}
                    className={`${inputBase} ${errors.category ? inputErr : inputOk}`}
                    placeholder="Escribe el nombre de la nueva categoría..."
                    autoFocus
                  />
                  <div className="flex justify-start mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setCategory('');
                        clearField('category');
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      ← Seleccionar categoría existente
                    </button>
                  </div>
                </div>
              )}

              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                <AlignLeft className="w-4 h-4 text-gray-400" />
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputBase} border-gray-300 focus:border-red-800 resize-none min-h-[80px]`}
                placeholder="Opcional: Agrega una descripción breve..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !category.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-red-900 text-white hover:bg-red-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditMode ? (
                'Guardar cambios'
              ) : (
                'Crear acto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
