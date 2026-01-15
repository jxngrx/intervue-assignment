export interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
}

export interface ApiError {
  status: string;
  message: string;
  errors?: any;
}
