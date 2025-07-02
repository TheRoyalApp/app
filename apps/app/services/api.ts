import { getItem, setItem, deleteItem } from '@/helpers/secureStore';
import { API_CONFIG, API_TIMEOUTS, API_RETRY_CONFIG } from '@/config/api';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  // Initialize tokens from secure storage
  async initialize() {
    try {
      console.log('API Client: Initializing...');
      console.log('API Client: Base URL:', this.baseURL);
      
      this.accessToken = await getItem('accessToken');
      this.refreshToken = await getItem('refreshToken');
      console.log('API Client initialized with tokens:', {
        hasAccessToken: !!this.accessToken,
        hasRefreshToken: !!this.refreshToken,
        accessTokenLength: this.accessToken?.length || 0
      });
      
      // Test connectivity
      try {
        const testResponse = await fetch(`${this.baseURL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        console.log('API Client: Connectivity test result:', testResponse.status);
      } catch (error) {
        console.warn('API Client: Connectivity test failed:', error);
      }
    } catch (error) {
      console.error('Error initializing API client:', error);
    }
  }

  // Set tokens
  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    console.log('Setting tokens:', {
      accessTokenSet: !!accessToken,
      refreshTokenSet: !!refreshToken,
      accessTokenLength: accessToken?.length || 0
    });
    
    try {
      await setItem('accessToken', accessToken);
      await setItem('refreshToken', refreshToken);
      console.log('Tokens stored successfully in secure storage');
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Clear tokens
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    try {
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Get headers for requests
  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      console.log('Including auth token in headers (length:', this.accessToken.length, ')');
    } else if (includeAuth) {
      console.log('Auth requested but no token available');
    }

    return headers;
  }

  // Retry logic
  private async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (retryCount < API_RETRY_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, API_RETRY_CONFIG.retryDelay));
        return this.retryRequest(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  // Make HTTP request with timeout
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.request);

    try {
      const url = `${this.baseURL}${endpoint}`;
      // Always reload the latest token before every request
      if (includeAuth) {
        this.accessToken = await getItem('accessToken');
        this.refreshToken = await getItem('refreshToken');
      }
      const headers = this.getHeaders(includeAuth);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle token refresh if 401
        if (response.status === 401 && this.refreshToken && includeAuth) {
          const refreshResult = await this.refreshAccessToken();
          if (refreshResult.success) {
            // Retry the original request
            return this.makeRequest(endpoint, options, includeAuth);
          }
        }

        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
          };
        }
      }
      
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<ApiResponse<AuthTokens>> {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        await this.clearTokens();
        return { success: false, error: data.message || 'Token refresh failed' };
      }

      const tokens = data.data || data;
      await this.setTokens(tokens.accessToken, tokens.refreshToken);

      return { success: true, data: tokens };
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearTokens();
      return { success: false, error: 'Token refresh failed' };
    }
  }

  // GET request
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.retryRequest(() => this.makeRequest<T>(endpoint, { method: 'GET' }, includeAuth));
  }

  // POST request
  async post<T>(endpoint: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.retryRequest(() => this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, includeAuth));
  }

  // PUT request
  async put<T>(endpoint: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.retryRequest(() => this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, includeAuth));
  }

  // DELETE request
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.retryRequest(() => this.makeRequest<T>(endpoint, { method: 'DELETE' }, includeAuth));
  }

  // PATCH request
  async patch<T>(endpoint: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.retryRequest(() => this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }, includeAuth));
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Initialize the client
apiClient.initialize(); 