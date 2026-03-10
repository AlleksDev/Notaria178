import { api } from '../../../config/axios';
import type {
  WorkFilters,
  WorksResponse,
  WorkDetail,
  WorkKPIs,
  CreateWorkRequest,
  WorkDocument,
  WorkRequirement,
} from '../types';

const cleanParams = (params: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
};

export const searchWorks = async (
  filters: WorkFilters
): Promise<WorksResponse> => {
  const { data } = await api.get<WorksResponse>('/works/search', {
    params: cleanParams(filters as unknown as Record<string, unknown>),
  });
  return data;
};

export const getWorkDetail = async (id: string): Promise<WorkDetail> => {
  const { data } = await api.get<{ data: WorkDetail }>(
    `/works/${encodeURIComponent(id)}`
  );
  return data.data;
};

export const getWorkKPIs = async (
  branchId?: string,
  timeframe: string = 'all'
): Promise<WorkKPIs> => {
  const params: Record<string, string> = { timeframe };
  if (branchId) params.branch_id = branchId;
  const { data } = await api.get<WorkKPIs>('/dashboard/kpis', { params });
  return data;
};

export const createWork = async (
  request: CreateWorkRequest
): Promise<WorkDetail> => {
  const { data } = await api.post<{ message: string; data: WorkDetail }>(
    '/works/create',
    request
  );
  return data.data;
};

export const updateWorkStatus = async (
  id: string,
  status: string
): Promise<WorkDetail> => {
  const { data } = await api.patch<{ message: string; data: WorkDetail }>(
    `/works/status/${encodeURIComponent(id)}`,
    { status }
  );
  return data.data;
};

export const getWorkDocuments = async (
  workId: string
): Promise<WorkDocument[]> => {
  const { data } = await api.get<{ data: WorkDocument[] }>(
    `/documents/work/${encodeURIComponent(workId)}`
  );
  return data.data ?? [];
};

export const getDocumentDownloadUrl = (docId: string): string => {
  return `${api.defaults.baseURL}/documents/download/${encodeURIComponent(docId)}`;
};

export const uploadWorkDocument = async (
  workId: string,
  file: File,
  category: string = 'DRAFT_DEED'
): Promise<WorkDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('work_id', workId);
  formData.append('category', category);
  formData.append('document_name', file.name);

  const { data } = await api.post<{ message: string; data: WorkDocument }>(
    '/documents/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data.data;
};

export const deleteDocument = async (docId: string): Promise<void> => {
  await api.delete(`/documents/${encodeURIComponent(docId)}`);
};

// ─── Work Acts ──────────────────────────────────────────────────────────────

export const addWorkAct = async (
  workId: string,
  actId: string
): Promise<WorkDetail> => {
  const { data } = await api.post<{ message: string; data: WorkDetail }>(
    `/works/${encodeURIComponent(workId)}/acts`,
    { act_id: actId }
  );
  return data.data;
};

export const removeWorkAct = async (
  workId: string,
  actId: string
): Promise<void> => {
  await api.delete(
    `/works/${encodeURIComponent(workId)}/acts/${encodeURIComponent(actId)}`
  );
};

// ─── Work Requirements (Ad-hoc) ────────────────────────────────────────────

export const addWorkRequirement = async (
  workId: string,
  name: string
): Promise<WorkRequirement> => {
  const { data } = await api.post<{ message: string; data: WorkRequirement }>(
    `/works/${encodeURIComponent(workId)}/requirements`,
    { name }
  );
  return data.data;
};

export const deleteWorkRequirement = async (
  workId: string,
  reqId: string
): Promise<void> => {
  await api.delete(
    `/works/${encodeURIComponent(workId)}/requirements/${encodeURIComponent(reqId)}`
  );
};

// ─── Client Update ─────────────────────────────────────────────────────────

export const updateClient = async (
  clientId: string,
  data: { full_name?: string; rfc?: string; phone?: string; email?: string }
): Promise<unknown> => {
  const { data: res } = await api.patch(
    `/clients/update/${encodeURIComponent(clientId)}`,
    data
  );
  return res.data;
};

// ─── Requirement document upload ───────────────────────────────────────────

export const uploadRequirementDocument = async (
  workId: string,
  file: File,
  requirementId: string,
  requirementSource: 'ACT' | 'WORK'
): Promise<WorkDocument> => {
  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/\s+/g, '_');
  const docName = `req_${requirementId.slice(0, 8)}_w${workId.slice(0, 8)}_${timestamp}_${cleanFileName}`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('work_id', workId);
  formData.append('category', 'CLIENT_REQUIREMENT');
  formData.append('document_name', docName);
  formData.append('requirement_id', requirementId);
  formData.append('requirement_source', requirementSource);

  const { data } = await api.post<{ message: string; data: WorkDocument }>(
    '/documents/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data.data;
};
