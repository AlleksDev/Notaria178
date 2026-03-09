import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Download,
  Upload,
  FileText,
  MessageSquare,
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Briefcase,
  User,
  ClipboardList,
  Layers,
  Plus,
  Maximize2,
  X,
  Loader2,
  Calendar,
  Trash2,
  Pencil,
  Search,
} from 'lucide-react';
import { api } from '../../../config/axios';
import {
  getWorkDetail,
  getWorkDocuments,
  uploadWorkDocument,
  deleteDocument,
  addWorkAct,
  removeWorkAct,
  addWorkRequirement,
  deleteWorkRequirement,
  uploadRequirementDocument,
  updateClient,
  updateWorkStatus
} from '../api/worksApi';
import { searchActs } from '../../acts/api';
import type { WorkDetail, WorkDocument } from '../types';
import type { Act } from '../../acts/types';
import { ConfirmModal } from '../../../components/ConfirmModal';

/* ─── Status config ─── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  APPROVED: { label: 'Aprobado', bg: 'bg-green-100', text: 'text-green-700' },
  PENDING: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  READY_FOR_REVIEW: { label: 'Listo para revisión', bg: 'bg-blue-100', text: 'text-blue-700' },
  IN_PROGRESS: { label: 'En proceso', bg: 'bg-gray-100', text: 'text-gray-600' },
  REJECTED: { label: 'Rechazado', bg: 'bg-red-100', text: 'text-red-700' },
};

/* ─── Tab definitions ─── */
const TABS = [
  { key: 'documento', label: 'Documento', icon: FileText },
  { key: 'comentarios', label: 'Comentarios', count: 3, icon: MessageSquare },
  { key: 'historial', label: 'Historial de versiones', icon: History },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ─── Accordion sections ─── */
const ACCORDION_SECTIONS = [
  { key: 'DATOS DEL TRABAJO', icon: Briefcase },
  { key: 'DATOS DEL CLIENTE', icon: User },
  { key: 'REQUISITOS', icon: ClipboardList },
  { key: 'ACTOS ASOCIADOS', icon: Layers },
] as const;

type SectionKey = (typeof ACCORDION_SECTIONS)[number]['key'];

/* ─── Helpers ─── */
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatRelativeTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return formatDate(dateStr);
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdf = (fileName: string) =>
  fileName.toLowerCase().endsWith('.pdf');



/* ─── Component ─── */
export const WorkDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  /* ─── Core state ─── */
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [documents, setDocuments] = useState<WorkDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docBlobSize, setDocBlobSize] = useState<number | null>(null);
  const [modalDocUrl, setModalDocUrl] = useState<string | null>(null);
  const [modalDocName, setModalDocName] = useState<string | null>(null);
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Modal / action state ─── */
  const [showAddActModal, setShowAddActModal] = useState(false);
  const [actSearchTerm, setActSearchTerm] = useState('');
  const [actCatalog, setActCatalog] = useState<Act[]>([]);
  const [isLoadingActs, setIsLoadingActs] = useState(false);
  const [addingActId, setAddingActId] = useState<string | null>(null);

  const [confirmRemoveAct, setConfirmRemoveAct] = useState<{ actId: string; actName: string } | null>(null);
  const [isRemovingAct, setIsRemovingAct] = useState(false);

  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [newReqName, setNewReqName] = useState('');
  const [isAddingReq, setIsAddingReq] = useState(false);

  const [confirmDeleteReq, setConfirmDeleteReq] = useState<{ reqId: string; reqName: string } | null>(null);
  const [isDeletingReq, setIsDeletingReq] = useState(false);

  const [confirmUnlinkDoc, setConfirmUnlinkDoc] = useState<{ docId: string; reqName: string } | null>(null);
  const [isUnlinkingDoc, setIsUnlinkingDoc] = useState(false);

  const [uploadingReqName, setUploadingReqName] = useState<string | null>(null);
  const reqFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingReqUpload, setPendingReqUpload] = useState<{ name: string; id: string; source: 'ACT' | 'WORK'; existingDocId?: string } | null>(null);

  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ full_name: '', rfc: '', phone: '', email: '' });
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientFormErrors, setClientFormErrors] = useState<{ phone?: string; email?: string }>({});

  const [isSendingReview, setIsSendingReview] = useState(false);

  const isClientFormDirty = useMemo(() => {
    const ci = work?.client_info;
    if (!ci) return false;
    return (
      clientForm.full_name.trim() !== (ci.full_name || '').trim() ||
      clientForm.rfc.trim() !== (ci.rfc || '').trim() ||
      clientForm.phone.trim() !== (ci.phone || '').trim() ||
      clientForm.email.trim() !== (ci.email || '').trim()
    );
  }, [clientForm, work?.client_info]);

  const isClientFormValid = useMemo(() => {
    if (!isClientFormDirty) return false;
    const { email, phone } = clientForm;
    if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false;
    if (phone?.trim() && !/^\d{10}$/.test(phone.trim())) return false;
    return true;
  }, [clientForm, isClientFormDirty]);

  const isApproved = work?.status === 'APPROVED';
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(['DATOS DEL TRABAJO', 'REQUISITOS'])
  );

  /* ─── Refresh helper ─── */
  const refreshWork = useCallback(async () => {
    if (!id) return;
    const workData = await getWorkDetail(id);
    setWork(workData);
  }, [id]);

  /* ─── Authenticated download helper ─── */
  const handleDownload = useCallback(async (doc: WorkDocument) => {
    try {
      const response = await api.get(`/documents/download/${encodeURIComponent(doc.id)}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.document_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      console.error('Error al descargar el documento');
    }
  }, []);

  /* ─── Generic document download by ID ─── */
  const handleDownloadById = useCallback(async (docId: string, fileName: string) => {
    try {
      const response = await api.get(`/documents/download/${encodeURIComponent(docId)}`, {
        responseType: 'blob',
      });
      let finalName = fileName;
      const disposition = response.headers['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=(['"].*?['"]|[^;\n]*)/)
        if (match?.[1]) finalName = match[1].replace(/['"]/g, '');
      }

      let extension = '';
      if (!finalName.includes('.')) {
        const ct = response.headers['content-type'] || '';
        const extMap: Record<string, string> = {
          'application/pdf': '.pdf',
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        };
        if (extMap[ct]) {
          extension = extMap[ct];
        }
      } else {
        const dotIdx = finalName.lastIndexOf('.');
        if (dotIdx !== -1) {
          extension = finalName.substring(dotIdx);
        }
      }

      // Helper for PascalCase and removing spaces/accents
      const cleanString = (str: string) => {
        if (!str) return 'SinDato';
        return str
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s-]/g, '')
          .trim()
          .split(/[\s_-]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('');
      };

      const folioPart = cleanString(work?.folio || 'SinFolio');
      const clientPart = cleanString(work?.client_info?.full_name || work?.client_name || 'SinCliente');
      const reqPart = cleanString(fileName);

      const downloadName = `${folioPart}_${clientPart}_${reqPart}${extension}`;

      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      console.error('Error al descargar documento');
    }
  }, [work]);

  /* ─── Preview document by ID (opens fullscreen modal) ─── */
  const handlePreviewById = useCallback(async (docId: string, docName: string) => {
    try {
      const response = await api.get(`/documents/download/${encodeURIComponent(docId)}`, {
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      setModalDocUrl(url);
      setModalDocName(docName);
      setIsDocumentModalOpen(true);
    } catch {
      console.error('Error al previsualizar documento');
    }
  }, []);

  const toggleAct = (actId: string) => {
    setExpandedActs((prev) => {
      const next = new Set(prev);
      if (next.has(actId)) next.delete(actId);
      else next.add(actId);
      return next;
    });
  };

  /* ─── File upload handler (main document) ─── */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setIsUploadingDoc(true);
      await uploadWorkDocument(id, file);

      const oldPrimaryDoc = documents.find(
        (d) => d.category === 'DRAFT_DEED' || d.category === 'FINAL_DEED'
      ) || documents[0];
      if (oldPrimaryDoc) {
        await deleteDocument(oldPrimaryDoc.id).catch(() => { });
      }

      const freshDocs = await getWorkDocuments(id);
      setDocuments(freshDocs);
    } catch (err) {
      console.error('Error al subir el documento:', err);
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [id, documents]);

  /* ─── Requirement document upload (replaces existing if any) ─── */
  const handleReqFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !pendingReqUpload) return;

    try {
      setUploadingReqName(pendingReqUpload.name);

      // Delete existing document before uploading replacement
      if (pendingReqUpload.existingDocId) {
        await deleteDocument(pendingReqUpload.existingDocId).catch(() => { });
      }

      await uploadRequirementDocument(id, file, pendingReqUpload.id, pendingReqUpload.source);
      await refreshWork();
    } catch (err) {
      console.error('Error al subir documento de requisito:', err);
    } finally {
      setUploadingReqName(null);
      setPendingReqUpload(null);
      if (reqFileInputRef.current) reqFileInputRef.current.value = '';
    }
  }, [id, pendingReqUpload, refreshWork]);

  /* ─── Add act ─── */
  const handleAddAct = useCallback(async (actId: string) => {
    if (!id) return;
    try {
      setAddingActId(actId);
      const updated = await addWorkAct(id, actId);
      setWork(updated);
      setShowAddActModal(false);
      setActSearchTerm('');
    } catch (err) {
      console.error('Error al agregar acto:', err);
    } finally {
      setAddingActId(null);
    }
  }, [id]);

  /* ─── Remove act ─── */
  const handleRemoveAct = useCallback(async () => {
    if (!id || !confirmRemoveAct) return;
    try {
      setIsRemovingAct(true);
      await removeWorkAct(id, confirmRemoveAct.actId);
      await refreshWork();
      setConfirmRemoveAct(null);
    } catch (err) {
      console.error('Error al quitar acto:', err);
    } finally {
      setIsRemovingAct(false);
    }
  }, [id, confirmRemoveAct, refreshWork]);

  /* ─── Add ad-hoc requirement ─── */
  const handleAddRequirement = useCallback(async () => {
    if (!id || !newReqName.trim()) return;
    try {
      setIsAddingReq(true);
      await addWorkRequirement(id, newReqName.trim());
      await refreshWork();
      setShowAddReqModal(false);
      setNewReqName('');
    } catch (err) {
      console.error('Error al agregar requisito:', err);
    } finally {
      setIsAddingReq(false);
    }
  }, [id, newReqName, refreshWork]);

  /* ─── Delete ad-hoc requirement ─── */
  const handleDeleteRequirement = useCallback(async () => {
    if (!id || !confirmDeleteReq) return;
    try {
      setIsDeletingReq(true);
      await deleteWorkRequirement(id, confirmDeleteReq.reqId);
      await refreshWork();
      setConfirmDeleteReq(null);
    } catch (err) {
      console.error('Error al eliminar requisito:', err);
    } finally {
      setIsDeletingReq(false);
    }
  }, [id, confirmDeleteReq, refreshWork]);

  /* ─── Unlink/delete a requirement document ─── */
  const handleUnlinkDoc = useCallback(async () => {
    if (!confirmUnlinkDoc) return;
    try {
      setIsUnlinkingDoc(true);
      await deleteDocument(confirmUnlinkDoc.docId);
      await refreshWork();
      setConfirmUnlinkDoc(null);
    } catch (err) {
      console.error('Error al desvincular documento:', err);
    } finally {
      setIsUnlinkingDoc(false);
    }
  }, [confirmUnlinkDoc, refreshWork]);

  /* ─── Save client edits ─── */
  const handleSaveClient = useCallback(async () => {
    if (!work?.client_info?.id) return;
    const errors: { phone?: string; email?: string } = {};
    if (clientForm.phone.trim() && !/^\d{10}$/.test(clientForm.phone.trim())) {
      errors.phone = 'El teléfono debe tener exactamente 10 dígitos numéricos';
    }
    if (clientForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.email.trim())) {
      errors.email = 'Ingresa un correo electrónico válido';
    }
    if (Object.keys(errors).length > 0) {
      setClientFormErrors(errors);
      return;
    }
    setClientFormErrors({});
    try {
      setIsSavingClient(true);
      await updateClient(work.client_info.id, clientForm);
      await refreshWork();
      setShowEditClientModal(false);
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
    } finally {
      setIsSavingClient(false);
    }
  }, [work?.client_info?.id, clientForm, refreshWork]);

  /* ─── Send to Review ─── */
  const handleSendToReview = useCallback(async () => {
    if (!id) return;
    try {
      setIsSendingReview(true);
      await updateWorkStatus(id, 'READY_FOR_REVIEW');
      await refreshWork();
    } catch (err) {
      console.error('Error al enviar a revisión:', err);
    } finally {
      setIsSendingReview(false);
    }
  }, [id, refreshWork]);

  /* ─── Search act catalog ─── */
  const handleSearchActs = useCallback(async (term: string) => {
    setActSearchTerm(term);
    if (term.length < 2) { setActCatalog([]); return; }
    try {
      setIsLoadingActs(true);
      const res = await searchActs(term);
      setActCatalog(res.data);
    } catch {
      setActCatalog([]);
    } finally {
      setIsLoadingActs(false);
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>('documento');

  /* ─── Initial data fetch ─── */
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [workData, docsData] = await Promise.all([
          getWorkDetail(id),
          getWorkDocuments(id),
        ]);

        if (!mounted) return;
        setWork(workData);
        setDocuments(docsData);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar el trabajo');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
      if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleSection = (section: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  /* ─── Derived data (computed before hooks to keep hook order stable) ─── */
  const primaryDoc = documents.find(
    (d) => d.category === 'DRAFT_DEED' || d.category === 'FINAL_DEED'
  ) || documents[0] || null;

  /* Fetch PDF blob for preview when primaryDoc changes */
  useEffect(() => {
    if (!primaryDoc || !isPdf(primaryDoc.document_name)) {
      setDocPreviewUrl(null);
      return;
    }
    let revoked = false;
    const fetchBlob = async () => {
      try {
        const response = await api.get(
          `/documents/download/${encodeURIComponent(primaryDoc.id)}`,
          { responseType: 'blob' }
        );
        if (revoked) return;
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDocPreviewUrl(url);
        setDocBlobSize(blob.size);
      } catch {
        console.error('Error al cargar previsualización');
      }
    };
    fetchBlob();
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDoc?.id]);

  /* ─── Loading / Error states ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#740A03]" />
          <p className="text-gray-400 text-sm">Cargando detalles del trabajo…</p>
        </div>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-600 font-medium text-lg">Error</p>
          <p className="text-red-400 text-sm mt-1">{error || 'Trabajo no encontrado'}</p>
        </div>
        <button
          onClick={() => navigate('/works')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a trabajos
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[work.status] || STATUS_CONFIG.PENDING;

  // Deduplicated requirements from backend + ad-hoc work requirements
  const dedupReqs = work.requirements ?? [];
  const workReqs = work.work_requirements ?? [];
  const allReqsCount = dedupReqs.length + workReqs.length;
  const completedDedup = dedupReqs.filter((r) => r.document_id);
  const pendingDedup = dedupReqs.filter((r) => !r.document_id);

  /* ─── Accordion content renderers ─── */
  const renderSectionContent = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'DATOS DEL TRABAJO': {
        return (
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-baseline gap-3">
              <dt className="text-gray-400 min-w-[100px] flex-shrink-0">Proyectista</dt>
              <dd className="font-semibold text-[#740A03]">
                {work.main_drafter_name || '—'}
              </dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="text-gray-400 min-w-[100px] flex-shrink-0">Folio</dt>
              <dd className="font-semibold text-gray-700">{work.folio || 'Sin asignar'}</dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="text-gray-400 min-w-[100px] flex-shrink-0">Fecha límite</dt>
              <dd className="font-semibold text-gray-700">
                {work.deadline ? formatDate(work.deadline) : 'Sin fecha'}
              </dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="text-gray-400 min-w-[100px] flex-shrink-0">Sucursal</dt>
              <dd className="font-semibold text-gray-700">{work.branch_name || '—'}</dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="text-gray-400 min-w-[100px] flex-shrink-0">Estado</dt>
              <dd>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
              </dd>
            </div>
          </dl>
        );
      }

      case 'DATOS DEL CLIENTE': {
        const ci = work.client_info;
        return (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-1 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-400 text-xs">Nombre completo</dt>
                <dd className="font-medium text-gray-700">{ci?.full_name || work.client_name || '—'}</dd>
              </div>
              {ci?.rfc && (
                <div>
                  <dt className="text-gray-400 text-xs">RFC</dt>
                  <dd className="font-medium text-gray-700">{ci.rfc}</dd>
                </div>
              )}
              {ci?.phone && (
                <div>
                  <dt className="text-gray-400 text-xs">Teléfono</dt>
                  <dd className="font-medium text-gray-700">{ci.phone}</dd>
                </div>
              )}
              {ci?.email && (
                <div>
                  <dt className="text-gray-400 text-xs">Correo</dt>
                  <dd className="font-medium text-gray-700">{ci.email}</dd>
                </div>
              )}
            </dl>
            {!isApproved && ci && (
              <button
                onClick={() => {
                  setClientForm({
                    full_name: ci.full_name || '',
                    rfc: ci.rfc || '',
                    phone: ci.phone || '',
                    email: ci.email || '',
                  });
                  setClientFormErrors({});
                  setShowEditClientModal(true);
                }}
                className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={12} />
                Editar datos del cliente
              </button>
            )}
          </div>
        );
      }

      case 'REQUISITOS':
        return (
          <div className="flex flex-col gap-4">
            {/* Metric pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-gray-300 text-gray-600">
                Total: <strong>{allReqsCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-green-400 text-green-700">
                Completados: <strong>{completedDedup.length}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-amber-400 text-amber-700">
                Pendientes: <strong>{pendingDedup.length + workReqs.filter((r) => !r.document_id).length}</strong>
              </span>
            </div>

            {/* Completed deduplicated requirements */}
            {completedDedup.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{req.name}</p>
                    <p className="text-xs text-gray-400">
                      De: {req.source_acts?.join(', ') || 'Acto'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => req.document_id && handlePreviewById(req.document_id, req.name)}
                    className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                    title="Previsualizar"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => req.document_id && handleDownloadById(req.document_id, req.name)}
                    className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                    title="Descargar"
                  >
                    <Download size={14} />
                  </button>
                  {!isApproved && (
                    <>
                      <button
                        onClick={() => {
                          setPendingReqUpload({ name: req.name, id: req.id, source: 'ACT', existingDocId: req.document_id });
                          reqFileInputRef.current?.click();
                        }}
                        disabled={uploadingReqName === req.name}
                        className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                        title="Subir nueva versión"
                      >
                        {uploadingReqName === req.name ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => req.document_id && setConfirmUnlinkDoc({ docId: req.document_id, reqName: req.name })}
                        className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                        title="Quitar documento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Pending deduplicated requirements */}
            {pendingDedup.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{req.name}</p>
                    <p className="text-xs text-amber-500 font-medium">
                      De: {req.source_acts?.join(', ') || 'Acto'}
                    </p>
                  </div>
                </div>
                {!isApproved && (
                  <button
                    onClick={() => {
                      setPendingReqUpload({ name: req.name, id: req.id, source: 'ACT', existingDocId: req.document_id });
                      reqFileInputRef.current?.click();
                    }}
                    disabled={uploadingReqName === req.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors flex-shrink-0"
                  >
                    {uploadingReqName === req.name ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    Subir
                  </button>
                )}
              </div>
            ))}

            {/* Ad-hoc work requirements */}
            {workReqs.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Requisitos adicionales</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                {workReqs.map((wr) => (
                  <div
                    key={wr.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {wr.document_id ? (
                        <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={18} className="text-gray-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{wr.name}</p>
                        <p className="text-xs text-gray-400">Requisito manual</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {wr.document_id && (
                        <>
                          <button
                            onClick={() => handlePreviewById(wr.document_id!, wr.name)}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                            title="Previsualizar"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownloadById(wr.document_id!, wr.name)}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                            title="Descargar"
                          >
                            <Download size={14} />
                          </button>
                        </>
                      )}
                      {!isApproved && (
                        <button
                          onClick={() => {
                            setPendingReqUpload({ name: wr.name, id: wr.id, source: 'WORK', existingDocId: wr.document_id });
                            reqFileInputRef.current?.click();
                          }}
                          disabled={uploadingReqName === wr.name}
                          className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${wr.document_id ? 'text-gray-500' : 'text-amber-500'}`}
                          title={wr.document_id ? 'Subir nueva versión' : 'Subir documento'}
                        >
                          {uploadingReqName === wr.name ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Upload size={14} />
                          )}
                        </button>
                      )}
                      {!isApproved && (
                        <button
                          onClick={() => setConfirmDeleteReq({ reqId: wr.id, reqName: wr.name })}
                          className="p-1.5 rounded-md hover:bg-red-100 text-red-400 transition-colors"
                          title="Eliminar requisito"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {allReqsCount === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No hay requisitos asociados a este trabajo.
              </p>
            )}

            {/* Hidden file input for requirement upload */}
            <input
              ref={reqFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleReqFileUpload}
              className="hidden"
            />

            {/* Add requirement button */}
            {!isApproved && (
              <button
                onClick={() => setShowAddReqModal(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-400 hover:border-[#740A03] hover:text-[#740A03] transition-colors"
              >
                <Plus size={16} />
                Agregar requisito
              </button>
            )}
          </div>
        );

      case 'ACTOS ASOCIADOS':
        return (
          <div className="space-y-3">
            {work.acts?.length ? (
              work.acts.map((act) => {
                const isExpanded = expandedActs.has(act.act_id);
                return (
                  <div
                    key={act.act_id}
                    className="rounded-lg border border-gray-200 bg-white overflow-hidden"
                  >
                    <div
                      onClick={() => toggleAct(act.act_id)}
                      className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                      role="button"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-800">{act.name}</h4>
                        {act.category && (
                          <p className="text-xs text-gray-400 mt-0.5">{act.category}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          {act.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                        {!isApproved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmRemoveAct({ actId: act.act_id, actName: act.name });
                            }}
                            className="p-1 rounded-md hover:bg-red-100 text-red-400 transition-colors"
                            title="Quitar acto"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div
                      className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-4 pb-3 pt-1 border-t border-gray-100 space-y-3">
                        {act.description && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Descripción</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{act.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-2">No hay actos asociados.</p>
            )}

            {/* Add act button */}
            {!isApproved && (
              <button
                onClick={() => setShowAddActModal(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-400 hover:border-[#740A03] hover:text-[#740A03] transition-colors"
              >
                <Plus size={16} />
                Agregar acto
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-8">
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/works')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-800">
                {work.folio ? `Escritura No. ${work.folio}` : 'Sin folio'}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar size={12} className="text-gray-400" />
              Creado: {formatDate(work.created_at)}
            </p>
          </div>
        </div>

        {/* Right side */}
        {!isApproved && work.status !== 'READY_FOR_REVIEW' && (
          <button 
            onClick={handleSendToReview}
            disabled={isSendingReview}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#740A03] text-[#740A03] font-semibold text-sm hover:bg-[#740A03]/5 transition-colors self-start sm:self-center disabled:opacity-50"
          >
            {isSendingReview ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
            Enviar a revisión
          </button>
        )}
      </div>

      {/* Section divider */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Detalles de trabajo</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ═══════════════════════ MAIN LAYOUT ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT COLUMN (Work Area) ─── */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-gray-200">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative ${isActive
                    ? 'text-[#740A03]'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {'count' in tab && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#740A03] text-white text-[10px] font-bold">
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#740A03] rounded-t" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ═══ Document Card with Thumbnail ═══ */}
          {primaryDoc ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header: file info + actions */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {primaryDoc.document_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatFileSize(docBlobSize)} – Modificado {formatRelativeTime(primaryDoc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(primaryDoc)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} />
                    Descargar
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isApproved || isUploadingDoc}
                    title={isApproved ? 'No se puede modificar un trabajo aprobado' : undefined}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isApproved || isUploadingDoc
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#740A03] text-white hover:bg-[#5c0802]'
                      }`}
                  >
                    {isUploadingDoc ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {isUploadingDoc ? 'Subiendo...' : 'Subir nueva versión'}
                  </button>
                </div>
              </div>

              {/* Thumbnail: cropped preview */}
              <div
                className="relative group cursor-pointer overflow-hidden bg-white h-99 w-full"
                onClick={() => {
                  if (docPreviewUrl) {
                    setModalDocUrl(docPreviewUrl);
                    setModalDocName(primaryDoc?.document_name || null);
                    setIsDocumentModalOpen(true);
                  }
                }}
              >
                {docPreviewUrl ? (
                  <iframe
                    src={`${docPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    title="Miniatura del documento"
                    frameBorder="0"
                    className="absolute -top-6 -left-6 w-[calc(100%+48px)] h-[calc(100%+48px)] border-none pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <FileText size={64} className="text-gray-200" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 shadow-lg text-sm font-semibold text-gray-700">
                    <Maximize2 size={16} />
                    Ver documento completo
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-sm text-gray-400">No hay documentos asociados a este trabajo.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isApproved || isUploadingDoc}
                title={isApproved ? 'No se puede modificar un trabajo aprobado' : undefined}
                className={`mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors mx-auto ${isApproved || isUploadingDoc
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#740A03] text-white hover:bg-[#5c0802]'
                  }`}
              >
                {isUploadingDoc ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {isUploadingDoc ? 'Subiendo...' : 'Subir documento'}
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* ═══ Fullscreen Document Modal ═══ */}
          {isDocumentModalOpen && modalDocUrl && (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-900/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#740A03]/80 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-white truncate">
                    {modalDocName || primaryDoc?.document_name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsDocumentModalOpen(false);
                    if (modalDocUrl && modalDocUrl !== docPreviewUrl) URL.revokeObjectURL(modalDocUrl);
                    setModalDocUrl(null);
                    setModalDocName(null);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body: full interactive PDF viewer */}
              <div className="flex-1 flex items-center justify-center p-4">
                <iframe
                  src={modalDocUrl}
                  title="Visor de documento completo"
                  className="w-full h-full max-w-[90vw] max-h-[90vh] rounded-lg border-0 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT COLUMN (Context) ─── */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {ACCORDION_SECTIONS.map(({ key: section, icon: SectionIcon }) => {
            const isOpen = openSections.has(section);
            return (
              <div
                key={section}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon size={16} className="text-[#740A03]" />
                    <span className="text-xs font-bold tracking-widest text-gray-500 italic uppercase">
                      {section}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>

                {/* Collapsible content */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-5 pb-4 pt-1">
                    {renderSectionContent(section)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════ MODALS ═══════════════════════ */}

      {/* ─── Add Act Modal ─── */}
      {showAddActModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddActModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[80vh] flex flex-col">
            <div className="px-8 pt-8 pb-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Agregar{' '}
                  <span className="italic text-primary">Acto</span>
                </h2>
                <button onClick={() => setShowAddActModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <div className="w-12 h-1 bg-primary rounded-full" />
                <div className="flex-1 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="mt-5 relative">
                <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar acto por nombre..."
                  value={actSearchTerm}
                  onChange={(e) => handleSearchActs(e.target.value)}
                  className="w-full pl-7 border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors border-gray-300 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-4">
              {isLoadingActs && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              )}
              {!isLoadingActs && actSearchTerm.length >= 2 && actCatalog.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No se encontraron actos.</p>
              )}
              {!isLoadingActs && actCatalog.length > 0 && (
                <div className="space-y-2">
                  {actCatalog
                    .filter((a) => !work.acts?.some((wa) => wa.act_id === a.id))
                    .map((act) => (
                      <button
                        key={act.id}
                        onClick={() => handleAddAct(act.id)}
                        disabled={addingActId === act.id}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gray-200 hover:border-[#740A03] hover:bg-[#740A03]/5 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{act.name}</p>
                          <p className="text-xs text-gray-400">{act.category}</p>
                        </div>
                        {addingActId === act.id ? (
                          <Loader2 size={16} className="animate-spin text-[#740A03] flex-shrink-0" />
                        ) : (
                          <Plus size={16} className="text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                </div>
              )}
              {!isLoadingActs && actSearchTerm.length < 2 && (
                <p className="text-sm text-gray-400 text-center py-8">Escribe al menos 2 caracteres para buscar.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Remove Act ─── */}
      <ConfirmModal
        isOpen={!!confirmRemoveAct}
        title="Quitar acto"
        message={`¿Estás seguro que deseas quitar el acto "${confirmRemoveAct?.actName}"? Los requisitos exclusivos de este acto se eliminarán de la lista de requisitos.`}
        confirmLabel="Quitar"
        variant="danger"
        isLoading={isRemovingAct}
        onConfirm={handleRemoveAct}
        onCancel={() => setConfirmRemoveAct(null)}
      />

      {/* ─── Add Requirement Modal ─── */}
      {showAddReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddReqModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-8 pt-8 pb-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Agregar{' '}
                  <span className="italic text-primary">Requisito</span>
                </h2>
                <button onClick={() => setShowAddReqModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <div className="w-12 h-1 bg-primary rounded-full" />
                <div className="flex-1 h-1 bg-gray-200 rounded-full" />
              </div>
            </div>
            <div className="px-8 pb-8 pt-5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Nombre del requisito
              </label>
              <input
                type="text"
                placeholder="ej. Acta de nacimiento"
                value={newReqName}
                onChange={(e) => setNewReqName(e.target.value)}
                className="w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors border-gray-300 focus:border-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddRequirement()}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddReqModal(false)}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddRequirement}
                  disabled={isAddingReq || !newReqName.trim()}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-white bg-[#740A03] rounded-lg hover:bg-[#5c0802] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAddingReq && <Loader2 size={14} className="animate-spin" />}
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Delete Requirement ─── */}
      <ConfirmModal
        isOpen={!!confirmDeleteReq}
        title="Eliminar requisito"
        message={`¿Estás seguro que deseas eliminar el requisito "${confirmDeleteReq?.reqName}"?`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeletingReq}
        onConfirm={handleDeleteRequirement}
        onCancel={() => setConfirmDeleteReq(null)}
      />

      {/* ─── Confirm Unlink Document ─── */}
      <ConfirmModal
        isOpen={!!confirmUnlinkDoc}
        title="Quitar documento"
        message={`¿Estás seguro que deseas eliminar el documento del requisito "${confirmUnlinkDoc?.reqName}"?`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isUnlinkingDoc}
        onConfirm={handleUnlinkDoc}
        onCancel={() => setConfirmUnlinkDoc(null)}
      />

      {/* ─── Edit Client Modal ─── */}
      {showEditClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditClientModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4">
            <div className="px-8 pt-8 pb-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Editar{' '}
                  <span className="italic text-primary">Cliente</span>
                </h2>
                <button onClick={() => setShowEditClientModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <div className="w-12 h-1 bg-primary rounded-full" />
                <div className="flex-1 h-1 bg-gray-200 rounded-full" />
              </div>
            </div>
            <div className="px-8 pb-8 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Nombre completo</label>
                  <input
                    type="text"
                    placeholder="ej. Juan Pérez López"
                    value={clientForm.full_name}
                    onChange={(e) => setClientForm((p) => ({ ...p, full_name: e.target.value }))}
                    className="w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors border-gray-300 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">RFC</label>
                  <input
                    type="text"
                    placeholder="ej. XAXX010101000"
                    value={clientForm.rfc}
                    onChange={(e) => setClientForm((p) => ({ ...p, rfc: e.target.value }))}
                    className="w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors border-gray-300 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Teléfono</label>
                  <input
                    type="text"
                    placeholder="ej. 9611234567"
                    value={clientForm.phone}
                    onChange={(e) => {
                      setClientForm((p) => ({ ...p, phone: e.target.value }));
                      if (clientFormErrors.phone) setClientFormErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    className={`w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors ${clientFormErrors.phone ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`}
                  />
                  {clientFormErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{clientFormErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Correo electrónico</label>
                  <input
                    type="text"
                    placeholder="ej. luis@gmail.com"
                    value={clientForm.email}
                    onChange={(e) => {
                      setClientForm((p) => ({ ...p, email: e.target.value }));
                      if (clientFormErrors.email) setClientFormErrors((p) => ({ ...p, email: undefined }));
                    }}
                    className={`w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors ${clientFormErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`}
                  />
                  {clientFormErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{clientFormErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditClientModal(false)}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveClient}
                  disabled={isSavingClient || !isClientFormValid}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-white bg-[#740A03] rounded-lg hover:bg-[#5c0802] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingClient && <Loader2 size={14} className="animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
