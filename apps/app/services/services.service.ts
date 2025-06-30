import { apiClient, ApiResponse } from './api';

// Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string; // Price comes as string from decimal field
  duration: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  duration: number;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

// Services Service
export class ServicesService {
  // Get all services
  static async getAllServices(): Promise<ApiResponse<Service[]>> {
    try {
      return await apiClient.get<Service[]>('/services');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch services',
      };
    }
  }

  // Get service by ID
  static async getServiceById(id: string): Promise<ApiResponse<Service>> {
    try {
      return await apiClient.get<Service>(`/services/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service',
      };
    }
  }

  // Get active services only
  static async getActiveServices(): Promise<ApiResponse<Service[]>> {
    try {
      const response = await this.getAllServices();
      
      if (response.success && response.data) {
        const activeServices = response.data.filter(service => service.isActive);
        return {
          success: true,
          data: activeServices,
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active services',
      };
    }
  }

  // Create new service (admin/staff only)
  static async createService(data: CreateServiceData): Promise<ApiResponse<Service>> {
    try {
      return await apiClient.post<Service>('/services', data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create service',
      };
    }
  }

  // Update service (admin/staff only)
  static async updateService(id: string, data: UpdateServiceData): Promise<ApiResponse<Service>> {
    try {
      return await apiClient.put<Service>(`/services/${id}`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update service',
      };
    }
  }

  // Delete service (admin/staff only)
  static async deleteService(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/services/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete service',
      };
    }
  }

  // Get services by price range
  static async getServicesByPriceRange(minPrice: number, maxPrice: number): Promise<ApiResponse<Service[]>> {
    try {
      const response = await this.getAllServices();
      
      if (response.success && response.data) {
        const filteredServices = response.data.filter(
          service => {
            const price = parseFloat(service.price);
            return price >= minPrice && price <= maxPrice && service.isActive;
          }
        );
        return {
          success: true,
          data: filteredServices,
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch services by price range',
      };
    }
  }

  // Get services by duration range
  static async getServicesByDurationRange(minDuration: number, maxDuration: number): Promise<ApiResponse<Service[]>> {
    try {
      const response = await this.getAllServices();
      
      if (response.success && response.data) {
        const filteredServices = response.data.filter(
          service => service.duration >= minDuration && service.duration <= maxDuration && service.isActive
        );
        return {
          success: true,
          data: filteredServices,
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch services by duration range',
      };
    }
  }
} 