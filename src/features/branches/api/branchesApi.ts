import { api } from '../../../config/axios';
import type { BranchesResponse } from '../types';

export const getBranches = async (): Promise<BranchesResponse> => {
  const { data } = await api.get<BranchesResponse>('/branches/search');
  return data;
};
