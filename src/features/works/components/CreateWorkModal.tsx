import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Loader2,
  ChevronDown,
  Search,
  Plus,
  Upload,
  FileText,
  Trash2,
  User,
  CalendarDays,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import { createWork } from '../api/worksApi';
import { api } from '../../../config/axios';
import { searchClients, createClient } from '../../clients/api';
import { searchActs } from '../../acts/api';
import { searchUsers } from '../../users/api/usersApi';
import { useAuthStore } from '../../../store/authStore';
import { getBranches } from '../../branches/api/branchesApi';
import type { Client, CreateClientRequest } from '../../clients/types';
import type { Act } from '../../acts/types';
import type { Proyectista } from '../../users/types';
import type { Branch } from '../../branches/types';

const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const avatarColors = [
  'bg-amber-600',
  'bg-green-700',
  'bg-blue-700',
  'bg-purple-600',
  'bg-pink-600',
  'bg-teal-600',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
};

interface CreateWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/* ──────────────────────────── MODAL ──────────────────────────── */

export const CreateWorkModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkModalProps) => {
  const user = useAuthStore((s) => s.user);

  /* ── form state ── */
  const [folio, setFolio] = useState('');
  const [deadline, setDeadline] = useState('');
  const [branchId, setBranchId] = useState('');
  const [mainDrafterId, setMainDrafterId] = useState('');
  const [selectedActIds, setSelectedActIds] = useState<string[]>([]);

  /* ── client inline form ── */
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientRFC, setClientRFC] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);

  /* ── documents (pre‑upload) ── */
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── lookups ── */
  const [clients, setClients] = useState<Client[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [drafters, setDrafters] = useState<Proyectista[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [isLoadingDrafters, setIsLoadingDrafters] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  /* ── drafter search ── */
  const [drafterSearch, setDrafterSearch] = useState('');
  const [showDrafterDropdown, setShowDrafterDropdown] = useState(false);
  const drafterRef = useRef<HTMLDivElement>(null);

  /* ── client search ── */
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  /* ── UI state ── */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isFormValid =
    (!isNewClient ? !!clientId : !!clientName.trim()) &&
    selectedActIds.length > 0 &&
    !!branchId &&
    !!folio.trim() &&
    !!deadline;

  /* ── Fetch lookups on open ── */
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const load = async () => {
      setIsLoadingLookups(true);
      try {
        const [clientRes, actRes, branchRes] = await Promise.all([
          searchClients(undefined, 100),
          searchActs(undefined, 100),
          getBranches(),
        ]);
        if (!mounted) return;
        setClients(clientRes.data ?? []);
        setActs(actRes.data ?? []);
        setBranches(branchRes.data ?? []);

        // default branch from auth user
        if (user?.branch_id) setBranchId(user.branch_id);
      } catch {
        // silent – lists will be empty
      } finally {
        if (mounted) setIsLoadingLookups(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, user?.branch_id]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        drafterRef.current &&
        !drafterRef.current.contains(e.target as Node)
      )
        setShowDrafterDropdown(false);
      if (clientRef.current && !clientRef.current.contains(e.target as Node))
        setShowClientDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Fetch drafters when branch changes ── */
  useEffect(() => {
    if (!isOpen || !branchId) {
      setDrafters([]);
      return;
    }
    let mounted = true;
    const loadDrafters = async () => {
      setIsLoadingDrafters(true);
      try {
        const res = await searchUsers({
          limit: 100,
          offset: 0,
          status: 'ACTIVE',
          branch_id: branchId,
        });
        if (mounted) setDrafters(res.data ?? []);
      } catch {
        // silent
      } finally {
        if (mounted) setIsLoadingDrafters(false);
      }
    };
    setMainDrafterId('');
    setDrafterSearch('');
    loadDrafters();
    return () => {
      mounted = false;
    };
  }, [isOpen, branchId]);

  /* ── Filtered lists ── */
  const filteredDrafters = drafters.filter(
    (d) =>
      (d.role === 'DRAFTER' || d.role === 'LOCAL_ADMIN') &&
      d.full_name.toLowerCase().includes(drafterSearch.toLowerCase())
  );

  const filteredClients = clients.filter((c) =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  /* ── Helpers ── */
  const selectedDrafter = drafters.find((d) => d.id === mainDrafterId);

  const clearField = (field: string) => {
    if (errors[field])
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
  };

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!clientId && !isNewClient) e.client = 'Este campo es obligatorio';
    if (isNewClient && !clientName.trim())
      e.clientName = 'Este campo es obligatorio';
    if (selectedActIds.length === 0) e.acts = 'Selecciona al menos un acto';
    if (!branchId) e.branch = 'Este campo es obligatorio';
    if (!folio.trim()) e.folio = 'Este campo es obligatorio';
    if (!deadline) e.deadline = 'Este campo es obligatorio';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSubmitted(true);
    if (!validate()) return;

    setIsLoading(true);
    try {
      // If new client, create first
      let resolvedClientId = clientId;
      if (isNewClient) {
        const req: CreateClientRequest = { full_name: clientName.trim() };
        if (clientRFC.trim()) req.rfc = clientRFC.trim();
        if (clientPhone.trim()) req.phone = clientPhone.trim();
        const newClient = await createClient(req);
        resolvedClientId = newClient.id;
      }

      // Create work
      const work = await createWork({
        branch_id: branchId,
        client_id: resolvedClientId,
        act_ids: selectedActIds,
        ...(mainDrafterId ? { main_drafter_id: mainDrafterId } : {}),
        folio: folio.trim(),
        deadline,
      });

      // Upload documents if any
      if (files.length > 0 && work?.id) {
        await Promise.allSettled(
          files.map((file) => {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('work_id', work.id);
            fd.append('category', 'CLIENT_REQUIREMENT');
            return api.post('/documents/upload', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          })
        );
      }

      resetForm();
      onSuccess();
    } catch (err) {
      if (isAxiosError(err)) {
        setApiError(
          err.response?.data?.error || 'Error al crear el trabajo'
        );
      } else {
        setApiError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFolio('');
    setDeadline('');
    setBranchId(user?.branch_id ?? '');
    setMainDrafterId('');
    setSelectedActIds([]);
    setClientId('');
    setClientName('');
    setClientRFC('');
    setClientPhone('');
    setIsNewClient(false);
    setFiles([]);
    setErrors({});
    setApiError('');
    setSubmitted(false);
    setDrafterSearch('');
    setClientSearch('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ── Create client inline ── */
  const handleCreateClient = async () => {
    if (!clientName.trim()) {
      setErrors((prev) => ({ ...prev, clientName: 'Este campo es obligatorio' }));
      return;
    }
    setIsCreatingClient(true);
    try {
      const req: CreateClientRequest = { full_name: clientName.trim() };
      if (clientRFC.trim()) req.rfc = clientRFC.trim();
      if (clientPhone.trim()) req.phone = clientPhone.trim();
      const newClient = await createClient(req);
      setClients((prev) => [newClient, ...prev]);
      setClientId(newClient.id);
      setIsNewClient(false);
      setClientName('');
      setClientRFC('');
      setClientPhone('');
      clearField('client');
    } catch (err) {
      if (isAxiosError(err)) {
        setApiError(err.response?.data?.error || 'Error al crear el cliente');
      }
    } finally {
      setIsCreatingClient(false);
    }
  };

  /* ── File handling ── */
  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx' || ext === 'doc';
    });
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  /* ── Toggle act selection ── */
  const toggleAct = (actId: string) => {
    setSelectedActIds((prev) =>
      prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId]
    );
    clearField('acts');
  };

  if (!isOpen) return null;

  /* ── Style helpers ── */
  const inputBase =
    'w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors';
  const inputOk = 'border-gray-300 focus:border-primary';
  const inputErr = 'border-red-500';

  const sectionTitle = (icon: React.ReactNode, text: string) => (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <span className="text-gray-500">{icon}</span>
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider italic">
        {text}
      </h3>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Agregar{' '}
              <span className="italic text-primary">Trabajo</span>
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <div className="w-12 h-1 bg-primary rounded-full" />
            <div className="flex-1 h-1 bg-gray-200 rounded-full" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5">
          <p className="text-sm text-gray-500 mb-1">
            Completa los datos para crear el trabajo notarial
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

          {/* ═══════ FOLIO + FECHA LIMITE ═══════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Folio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={folio}
                onChange={(e) => {
                  setFolio(e.target.value);
                  clearField('folio');
                }}
                className={`${inputBase} ${errors.folio ? inputErr : inputOk}`}
                placeholder="Ej. 2025-0889"
              />
              {errors.folio && (
                <p className="mt-1 text-xs text-red-500">{errors.folio}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Fecha límite <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    clearField('deadline');
                  }}
                  className={`${inputBase} ${errors.deadline ? inputErr : inputOk} pr-8`}
                />
                <CalendarDays className="absolute right-0 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.deadline && (
                <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>
              )}
            </div>
          </div>

          {/* ═══════ SUCURSAL ═══════ */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Sucursal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  clearField('branch');
                }}
                className={`${inputBase} appearance-none cursor-pointer pr-8 ${
                  errors.branch ? inputErr : inputOk
                }`}
              >
                <option value="">Selecciona una sucursal</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.branch && (
              <p className="mt-1 text-xs text-red-500">{errors.branch}</p>
            )}
          </div>

          {/* ═══════ PROYECTISTA ASIGNADO ═══════ */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Proyectista asignado
            </label>

            <div ref={drafterRef} className="relative">
              {!selectedDrafter ? (
                /* Search input / Dropdown Container */
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={drafterSearch}
                      onChange={(e) => {
                        setDrafterSearch(e.target.value);
                        setShowDrafterDropdown(true);
                      }}
                      onFocus={() => setShowDrafterDropdown(true)}
                      className={`w-full border border-gray-200 rounded-lg py-2.5 pl-9 pr-8 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors bg-white`}
                      placeholder="Buscar por nombre..."
                    />
                    <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" strokeWidth={1.5} />
                  </div>

                  {/* Dropdown Options */}
                  {showDrafterDropdown && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar p-2 outline-none">
                      {isLoadingDrafters ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : !branchId ? (
                        <p className="text-sm text-gray-400 py-6 text-center">
                          Selecciona una sucursal primero
                        </p>
                      ) : filteredDrafters.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">
                          Sin resultados
                        </p>
                      ) : (
                        filteredDrafters.map((d) => (
                           <button
                             key={d.id}
                             type="button"
                             onClick={() => {
                               setMainDrafterId(d.id);
                               setDrafterSearch('');
                               setShowDrafterDropdown(false);
                             }}
                             className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-gray-50"
                           >
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base ${getAvatarColor(d.full_name)}`}>
                                {getInitials(d.full_name)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[15px] font-medium text-gray-800 leading-tight mb-0.5">{d.full_name}</span>
                                <span className="text-sm text-gray-500 leading-tight">
                                  {d.role === 'LOCAL_ADMIN' ? 'Administrador local' : 'Notario titular'}
                                </span>
                              </div>
                           </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Selected State & Change Button */
                <div className="flex flex-col gap-3">
                  <div className="w-full border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base ${getAvatarColor(selectedDrafter.full_name)}`}>
                        {getInitials(selectedDrafter.full_name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-gray-800 leading-tight mb-0.5">{selectedDrafter.full_name}</span>
                        <span className="text-sm text-gray-500 leading-tight">
                          {selectedDrafter.role === 'LOCAL_ADMIN' ? 'Administrador local' : 'Notario titular'}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-700" strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMainDrafterId('');
                        setDrafterSearch('');
                        setShowDrafterDropdown(true);
                        
                        setTimeout(() => {
                           const firstInput = drafterRef.current?.querySelector('input');
                           firstInput?.focus();
                        }, 0);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Buscar diferente
                    </button>
                    
                    {/* Add empty div to keep same width as client buttons if needed, or remove flex gap and use self-start if preferred 
                        Here we just keep it simple and stretch the button to fill or match the client layout structure.
                    */}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ DATOS DEL CLIENTE ═══════ */}
          <div className="h-px bg-gray-200 mb-4" />
          {sectionTitle(
            <User className="w-4 h-4" />,
            'Datos del cliente'
          )}

          {/* Client selector or inline form */}
          {!isNewClient ? (
            <div ref={clientRef} className="relative mb-6">
              {!clientId ? (
                /* Search input & Dropdown Container */
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                        clearField('client');
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className={`w-full border rounded-lg py-2.5 pl-9 pr-8 text-sm placeholder-gray-400 focus:outline-none transition-colors ${
                        errors.client
                          ? 'border-red-500'
                          : 'border-gray-200 focus:border-primary'
                      } bg-white`}
                      placeholder="Buscar cliente existente..."
                    />
                    <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" strokeWidth={1.5} />
                  </div>

                  {/* Dropdown Options */}
                  {showClientDropdown && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar p-2 outline-none">
                      {isLoadingLookups ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : filteredClients.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">
                          Sin resultados
                        </p>
                      ) : (
                        filteredClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setClientId(c.id);
                              setClientSearch('');
                              setShowClientDropdown(false);
                              clearField('client');
                            }}
                            className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-gray-50"
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base ${getAvatarColor(c.full_name)}`}>
                              {getInitials(c.full_name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-medium text-gray-800 leading-tight mb-0.5">{c.full_name}</span>
                              <span className="text-sm text-gray-500 leading-tight">
                                {c.rfc || 'Sin RFC'}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {errors.client && (
                    <p className="mt-1 text-xs text-red-500">{errors.client}</p>
                  )}

                  {/* "+ Agregar cliente nuevo" button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewClient(true);
                        setClientId('');
                        setClientSearch('');
                        clearField('client');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gold rounded-lg text-gold hover:bg-gold/5 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar cliente nuevo
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected State & Change Buttons */
                <div className="flex flex-col gap-3 mb-2">
                  <div className="w-full border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base ${getAvatarColor(clients.find((c) => c.id === clientId)?.full_name ?? '')}`}>
                        {getInitials(clients.find((c) => c.id === clientId)?.full_name ?? '')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-gray-800 leading-tight mb-0.5">{clients.find((c) => c.id === clientId)?.full_name}</span>
                        <span className="text-sm text-gray-500 leading-tight">
                          {clients.find((c) => c.id === clientId)?.rfc || 'Sin RFC'}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-700" strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setClientId('');
                        setClientSearch('');
                        setShowClientDropdown(true);
                        
                        setTimeout(() => {
                           const firstInput = clientRef.current?.querySelector('input');
                           firstInput?.focus();
                        }, 0);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Buscar diferente
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewClient(true);
                        setClientId('');
                        setClientSearch('');
                        clearField('client');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border border-gold rounded-lg text-gold hover:bg-gold/5 transition-colors text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nuevo cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Inline new client form */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    clearField('clientName');
                  }}
                  className={`${inputBase} ${errors.clientName ? inputErr : inputOk}`}
                  placeholder="Ej. Lic. Luis Ernesto Perez Montoya"
                />
                {errors.clientName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.clientName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={clientRFC}
                    onChange={(e) =>
                      setClientRFC(e.target.value.toUpperCase())
                    }
                    className={`${inputBase} ${inputOk}`}
                    placeholder="Ej. PEMO801215HCS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className={`${inputBase} ${inputOk}`}
                    placeholder="961 456 7890"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewClient(false);
                    setClientName('');
                    setClientRFC('');
                    setClientPhone('');
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  ← Seleccionar cliente existente
                </button>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={isCreatingClient || !clientName.trim()}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                    isCreatingClient || !clientName.trim()
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gold text-white hover:bg-gold/90'
                  }`}
                >
                  {isCreatingClient ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Crear cliente
                </button>
              </div>
            </>
          )}

          {/* ═══════ ACTOS NOTARIALES ═══════ */}
          <div className="h-px bg-gray-200 mb-4" />
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Actos notariales <span className="text-red-500">*</span>
            </label>

            {isLoadingLookups ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Cargando actos...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {acts.map((act) => {
                  const selected = selectedActIds.includes(act.id);
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => toggleAct(act.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {act.name}
                    </button>
                  );
                })}
              </div>
            )}

            {errors.acts && (
              <p className="mt-1 text-xs text-red-500">{errors.acts}</p>
            )}
          </div>

          {/* ═══════ DOCUMENTOS INICIALES ═══════ */}
          <div className="h-px bg-gray-200 mb-4" />
          {sectionTitle(
            <FileText className="w-4 h-4" />,
            'Documentos iniciales'
          )}

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-colors mb-2"
          >
            <Upload className="w-6 h-6 text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">
              Arrastra los documentos o haz clic para subir
            </p>
            <p className="text-xs text-gray-400">
              Soporta PDF, Word (.docx)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {f.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ═══════ BUTTONS ═══════ */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || (!isFormValid && !submitted)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider text-white rounded-lg transition-colors ${
                isLoading
                  ? 'bg-primary/60 cursor-wait'
                  : !isFormValid && !submitted
                    ? 'bg-primary/40 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </span>
              ) : (
                'Crear trabajo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
