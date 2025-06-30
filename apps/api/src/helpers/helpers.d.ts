export interface Response {
  success: boolean;
  data?: object;
  message?: string;
  error?: any;
  status: number;
}