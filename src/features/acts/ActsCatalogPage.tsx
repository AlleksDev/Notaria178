import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Loader2, Filter, ChevronDown } from 'lucide-react';
import { KpiCards } from '../../components/KpiCards';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CategoryAccordion } from './components/CategoryAccordion';
import { ActListItem } from './components/ActListItem';
import { ActFormModal } from './components/ActFormModal';
import { GlobalSearch } from '../../components/GlobalSearch';
import { getActsCatalog, deleteAct, toggleActStatus } from './api';
import type { Act } from './types';

export const ActsCatalogPage: React.FC = () => {
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAct, setEditingAct] = useState<Act | null>(null);

  // Confirm (delete/deactivate) modal state
  const [confirmTarget, setConfirmTarget] = useState<Act | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCatalog = async () => {
    try {
      setIsLoading(true);
      const res = await getActsCatalog();
      setActs(res.data);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Filter acts based on search term and status
  const filteredActs = useMemo(() => {
    let result = acts;
    if (statusFilter !== 'ALL') {
      result = result.filter(act => act.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(act => act.name.toLowerCase().includes(lowerSearch));
    }
    return result;
  }, [acts, searchTerm, statusFilter]);

  // KPIs calculation from total acts array
  const totalActs = acts.length;
  const activeActs = acts.filter(a => a.status === 'ACTIVE').length;
  const inactiveActs = acts.filter(a => a.status === 'INACTIVE').length;

  // Group by category
  const groupedActs = useMemo(() => {
    const groups: Record<string, Act[]> = {};
    filteredActs.forEach(act => {
      const cat = act.category || 'General';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(act);
    });
    return groups;
  }, [filteredActs]);

  // Extract unique categories for the Datalist
  const existingCategories = useMemo(() => {
    return Array.from(new Set(acts.map((a) => a.category || 'General')));
  }, [acts]);

  // ── Edit handler ──
  const handleEdit = (act: Act) => {
    setEditingAct(act);
    setIsModalOpen(true);
  };

  // ── Delete/Deactivate handler ──
  const handleDelete = (act: Act) => {
    setConfirmTarget(act);
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setIsConfirmLoading(true);
    try {
      if (confirmTarget.works_count > 0) {
        // Deactivate (has linked works, can't delete)
        await toggleActStatus(confirmTarget.id);
      } else {
        // Physical delete (orphan act)
        await deleteAct(confirmTarget.id);
      }
      setConfirmTarget(null);
      fetchCatalog();
    } catch (err) {
      console.error('Error en acción de confirmación:', err);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  // ── Confirm modal computed props ──
  const confirmTitle = confirmTarget
    ? confirmTarget.works_count > 0
      ? 'Desactivar acto'
      : 'Eliminar acto'
    : '';

  const confirmMessage = confirmTarget
    ? confirmTarget.works_count > 0
      ? `Este acto tiene ${confirmTarget.works_count} ${confirmTarget.works_count === 1 ? 'trabajo vinculado' : 'trabajos vinculados'}, por lo que no puede ser eliminado permanentemente para proteger el historial. ¿Deseas desactivarlo para que no aparezca en nuevos trámites?`
      : `Este acto no tiene trabajos vinculados. ¿Estás seguro de que deseas eliminarlo permanentemente? Esta acción no se puede deshacer.`
    : '';

  const confirmLabel = confirmTarget
    ? confirmTarget.works_count > 0
      ? 'Desactivar'
      : 'Eliminar'
    : '';

  const confirmVariant: 'danger' | 'warning' = confirmTarget?.works_count
    ? 'warning'
    : 'danger';

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-8">
      {/* Smart search bar + global filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <div className="flex-1 w-full max-w-[500px]">
          <GlobalSearch 
            placeholder="Buscar acto legal..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        
        <div className="flex-shrink-0 sm:ml-auto">
          {/* Status Filter Dropdown */}
          <div className="relative" ref={statusRef}>
            <button 
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <Filter className="w-4 h-4" />
              <span>{statusFilter === 'ALL' ? 'Todos los actos' : statusFilter === 'ACTIVE' ? 'Activos' : 'Inactivos'}</span>
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isStatusOpen && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                {[
                  { value: 'ALL', label: 'Todos los actos' },
                  { value: 'ACTIVE', label: 'Activos' },
                  { value: 'INACTIVE', label: 'Inactivos' }
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${statusFilter === option.value ? 'font-bold text-primary bg-primary/5' : 'text-gray-700 font-medium'}`}
                    onClick={() => {
                      setStatusFilter(option.value as any);
                      setIsStatusOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-600">Catálogo de Actos</h1>
      </div>

      {/* Action buttons matching Trabajos tabs level */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              setEditingAct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm focus:outline-none"
          >
            <Plus size={16} />
            Nuevo acto
          </button>
        </div>
      </div>

      <KpiCards 
        total={totalActs} 
        active={activeActs} 
        inactive={inactiveActs} 
        totalLabel="TOTAL DE ACTOS"
        activeLabel="ACTIVOS"
        inactiveLabel="INACTIVOS"
      />

      <div className="flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 font-medium">Cargando catálogo...</span>
          </div>
        ) : totalActs === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron actos</h3>
            <p className="text-gray-500">Prueba con otros términos de búsqueda o agrega un nuevo acto.</p>
          </div>
        ) : (
          Object.entries(groupedActs).map(([categoryName, categoryActs]) => (
            <CategoryAccordion 
              key={categoryName}
              category={categoryName}
              actsCount={categoryActs.length}
            >
              {categoryActs.map(act => (
                <ActListItem 
                  key={act.id} 
                  act={act}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </CategoryAccordion>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <ActFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAct(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingAct(null);
          fetchCatalog();
        }}
        existingCategories={existingCategories}
        editingAct={editingAct}
      />

      {/* Delete/Deactivate Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmTarget}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        variant={confirmVariant}
        isLoading={isConfirmLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};
