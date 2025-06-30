import type { Response } from "./helpers.d";

export function successResponse(status: number, data: object): Response {
  return {
    success: true,
    status: 200,
    data,
  };
}

export function errorResponse(status: number, message?: string, error?: any): Response {
  return {
    success: false,
    message: message || error?.message,
    status,
    error,
  };
}