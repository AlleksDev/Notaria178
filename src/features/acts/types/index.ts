export interface Act {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export interface ActsResponse {
  total: number;
  data: Act[];
}
