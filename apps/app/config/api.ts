// API Configuration
export const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:3001',
  },
  
  // Production
  production: {
    baseURL: 'https://your-api-domain.com', // Replace with your actual production API URL
  },
  
  // Get current environment
  get current() {
    return __DEV__ ? this.development : this.production;
  },
  
  // Get base URL for current environment
  get baseURL() {
    return this.current.baseURL;
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    signup: '/auth/signup',
    signin: '/auth/signin',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    deleteAccount: '/auth/delete-account',
  },
  
  // Users
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
  },
  
  // Appointments
  appointments: {
    create: '/appointments',
    getUserAppointments: '/appointments/user/me',
    getById: (id: string) => `/appointments/${id}`,
    update: (id: string) => `/appointments/${id}`,
    cancel: (id: string) => `/appointments/${id}/status`,
    reschedule: (id: string) => `/appointments/${id}/reschedule`,
    delete: (id: string) => `/appointments/${id}`,
    // Admin endpoints
    getByStatus: (status: string) => `/appointments/${status}`,
    updateStatus: (id: string) => `/appointments/${id}/status`,
  },
  
  // Services
  services: {
    getAll: '/services',
    getById: (id: string) => `/services/${id}`,
    create: '/services',
    update: (id: string) => `/services/${id}`,
    delete: (id: string) => `/services/${id}`,
  },
  
  // Schedules
  schedules: {
    getAvailability: '/schedules/availability',
    getBarberSchedules: (barberId: string) => `/schedules/barber/${barberId}`,
    getAll: '/schedules',
    setSchedule: '/schedules/set-schedule',
    update: (id: string) => `/schedules/${id}`,
    delete: (id: string) => `/schedules/${id}`,
  },
  
  // Payments
  payments: {
    create: '/payments',
    getById: (id: string) => `/payments/${id}`,
    getUserPayments: '/payments/user/me',
    getByAppointment: (appointmentId: string) => `/payments/appointment/${appointmentId}`,
    createIntent: '/payments/create-intent',
    confirm: (id: string) => `/payments/${id}/confirm`,
    cancel: (id: string) => `/payments/${id}/cancel`,
    refund: (id: string) => `/payments/${id}/refund`,
    stats: '/payments/stats',
  },
};

// API Headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// API Timeouts
export const API_TIMEOUTS = {
  request: 5000, // 5 seconds (reduced from 10)
  upload: 30000, // 30 seconds
  staffRequest: 3000, // 3 seconds for staff requests (faster)
};

// API Retry Configuration
export const API_RETRY_CONFIG = {
  maxRetries: 2, // Reduced from 3
  retryDelay: 500, // 0.5 seconds (reduced from 1 second)
  retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
}; 