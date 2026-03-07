export interface GetTransparency {
  page?: number;
  pageSize?: number;
  year?: number;
  status?: string;
  title?: string;
}

export interface GetTransparencyCount {
  year?: number;
  title?: string;
  status?: string;
}
