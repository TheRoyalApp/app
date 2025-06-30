import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ApiResponse } from '@/services';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
}

export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<ApiResponse<T>>,
  options: {
    showErrorAlert?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { showErrorAlert = true, onSuccess, onError } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await apiCall(...args);
        
        if (response.success && response.data) {
          setState(prev => ({ ...prev, data: response.data!, loading: false }));
          onSuccess?.(response.data);
          return response.data;
        } else {
          const errorMessage = response.error || 'Operation failed';
          setState(prev => ({ ...prev, error: errorMessage, loading: false }));
          
          if (showErrorAlert) {
            Alert.alert('Error', errorMessage);
          }
          
          onError?.(errorMessage);
          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
        
        if (showErrorAlert) {
          Alert.alert('Error', errorMessage);
        }
        
        onError?.(errorMessage);
        return null;
      }
    },
    [apiCall, showErrorAlert, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

// Specialized hooks for common patterns
export function useApiList<T = any>(
  apiCall: (...args: any[]) => Promise<ApiResponse<T[]>>,
  options: {
    showErrorAlert?: boolean;
    onSuccess?: (data: T[]) => void;
    onError?: (error: string) => void;
  } = {}
) {
  return useApi(apiCall, options);
}

export function useApiCreate<T = any, CreateData = any>(
  apiCall: (data: CreateData) => Promise<ApiResponse<T>>,
  options: {
    showErrorAlert?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    resetOnSuccess?: boolean;
  } = {}
) {
  const { resetOnSuccess = true, ...restOptions } = options;
  
  const hook = useApi(apiCall, {
    ...restOptions,
    onSuccess: (data) => {
      restOptions.onSuccess?.(data);
      if (resetOnSuccess) {
        hook.reset();
      }
    },
  });
  
  return hook;
}

export function useApiUpdate<T = any, UpdateData = any>(
  apiCall: (id: string, data: UpdateData) => Promise<ApiResponse<T>>,
  options: {
    showErrorAlert?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
) {
  return useApi(apiCall, options);
}

export function useApiDelete<T = any>(
  apiCall: (id: string) => Promise<ApiResponse<T>>,
  options: {
    showErrorAlert?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
) {
  return useApi(apiCall, options);
} 