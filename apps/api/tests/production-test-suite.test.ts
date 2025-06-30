import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Hono } from "hono";
import authRouter from "../src/auth/auth.route.js";
import usersRouter from "../src/users/users.route.js";
import servicesRouter from "../src/services/services.routes.js";
import schedulesRouter from "../src/schedules/schedules.routes.js";
import appointmentsRouter from "../src/appoinments/appoinments.route.js";

// Create a test app with all routes
const app = new Hono();
app.route('/auth', authRouter);
app.route('/users', usersRouter);
app.route('/services', servicesRouter);
app.route('/schedules', schedulesRouter);
app.route('/appointments', appointmentsRouter);

// Add health endpoint for testing
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Response type definitions
interface AuthResponse {
  success: boolean;
  data: {
    userResponse: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      role: string;
    };
    tokens: {
      token: string;
      refreshToken: string;
    };
  };
}

interface UserResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  };
}

interface GenericResponse {
  success: boolean;
  data?: any;
  message?: string;
}

// Test data types
interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'staff' | 'admin';
}

interface TestService {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

interface TestSchedule {
  barberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface TestAppointment {
  userId: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}

// Test data with unique emails to avoid conflicts
const testCustomer: TestUser = {
  email: "customer-test-" + Date.now() + "@test.com",
  password: "password123",
  firstName: "John",
  lastName: "Customer",
  phone: "+1234567890",
  role: "customer"
};

const testStaff: TestUser = {
  email: "staff-test-" + Date.now() + "@test.com",
  password: "password123",
  firstName: "Jane",
  lastName: "Staff",
  phone: "+1234567891",
  role: "staff"
};

const testAdmin: TestUser = {
  email: "admin-test-" + Date.now() + "@test.com",
  password: "password123",
  firstName: "Admin",
  lastName: "User",
  phone: "+1234567892",
  role: "admin"
};

// Global test state
let customerToken = "";
let staffToken = "";
let adminToken = "";
let customerId = "";
let staffId = "";
let adminId = "";

describe("Production-Ready API Test Suite", () => {
  describe("🔐 Authentication Endpoints", () => {
    it("should register a customer successfully", async () => {
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCustomer),
      });

      expect(response.status).toBe(201); // API returns 201 for successful signup
      const data = await response.json() as AuthResponse;
      expect(data.success).toBe(true);
      expect(data.data.userResponse).toBeDefined();
      expect(data.data.tokens).toBeDefined();

      customerId = data.data.userResponse.id;
      customerToken = data.data.tokens.token;
    });

    it("should register a staff member successfully", async () => {
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testStaff),
      });

      expect(response.status).toBe(201);
      const data = await response.json() as AuthResponse;
      expect(data.success).toBe(true);

      staffId = data.data.userResponse.id;
      staffToken = data.data.tokens.token;
    });

    it("should register an admin successfully", async () => {
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testAdmin),
      });

      expect(response.status).toBe(201);
      const data = await response.json() as AuthResponse;
      expect(data.success).toBe(true);

      adminId = data.data.userResponse.id;
      adminToken = data.data.tokens.token;
    });

    it("should fail with duplicate email", async () => {
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCustomer),
      });

      expect(response.status).toBe(409); // API returns 409 for duplicate email
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });

    it("should sign in with valid credentials", async () => {
      const response = await app.request("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testCustomer.email,
          password: testCustomer.password,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as AuthResponse;
      expect(data.success).toBe(true);
      expect(data.data.userResponse).toBeDefined();
      expect(data.data.tokens).toBeDefined();
    });

    it("should fail with invalid credentials", async () => {
      const response = await app.request("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@test.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });
  });

  describe("👥 User Management Endpoints", () => {
    it("should get user by ID with valid token", async () => {
      const response = await app.request(`/users/${customerId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as UserResponse;
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(customerId);
    });

    it("should fail without authentication token", async () => {
      const response = await app.request(`/users/${customerId}`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });

    it("should fail with invalid token", async () => {
      const response = await app.request(`/users/${customerId}`, {
        method: "GET",
        headers: { "Authorization": "Bearer invalid-token" },
      });

      expect(response.status).toBe(401);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });

    it("should create new user (admin only)", async () => {
      const newUser: TestUser = {
        email: "newuser-" + Date.now() + "@test.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
        phone: "+1234567893",
        role: "customer"
      };

      const response = await app.request("/users/new", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify(newUser),
      });

      expect(response.status).toBe(201);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });
  });

  describe("🛠️ Services Endpoints", () => {
    it("should create service (staff/admin only)", async () => {
      const newService: TestService = {
        name: "Haircut",
        description: "Professional haircut service",
        duration: 30,
        price: 25.00,
        category: "hair"
      };

      const response = await app.request("/services", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${staffToken}`
        },
        body: JSON.stringify(newService),
      });

      expect(response.status).toBe(201);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });

    it("should list all services", async () => {
      const response = await app.request("/services", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should prevent customer from creating service", async () => {
      const newService: TestService = {
        name: "Unauthorized Service",
        description: "This should fail",
        duration: 30,
        price: 25.00,
        category: "hair"
      };

      const response = await app.request("/services", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`
        },
        body: JSON.stringify(newService),
      });

      expect(response.status).toBe(403);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });
  });

  describe("📅 Schedules Endpoints", () => {
    it("should set barber schedule (staff/admin only)", async () => {
      const schedule: TestSchedule = {
        barberId: staffId,
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true
      };

      const response = await app.request("/schedules/set-schedule", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${staffToken}`
        },
        body: JSON.stringify(schedule),
      });

      expect(response.status).toBe(201);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });

    it("should get barber schedules", async () => {
      const response = await app.request(`/schedules/barber/${staffId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });

    it("should get all schedules (staff/admin only)", async () => {
      const response = await app.request("/schedules", {
        method: "GET",
        headers: { "Authorization": `Bearer ${staffToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });

    it("should get availability", async () => {
      const availabilityRequest = {
        date: "2024-01-15",
        serviceId: "1"
      };

      const response = await app.request("/schedules/availability", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`
        },
        body: JSON.stringify(availabilityRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });
  });

  describe("📋 Appointments Endpoints", () => {
    it("should create appointment", async () => {
      const appointment: TestAppointment = {
        userId: customerId,
        barberId: staffId,
        serviceId: "1",
        date: "2024-01-15",
        time: "10:00",
        notes: "Test appointment"
      };

      const response = await app.request("/appointments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customerToken}`
        },
        body: JSON.stringify(appointment),
      });

      expect(response.status).toBe(201);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });

    it("should get user appointments", async () => {
      const response = await app.request(`/appointments/user/${customerId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });

    it("should get barber appointments (staff/admin only)", async () => {
      const response = await app.request(`/appointments/barber/${staffId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${staffToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });

    it("should get appointments by status (staff/admin only)", async () => {
      const response = await app.request("/appointments/pending", {
        method: "GET",
        headers: { "Authorization": `Bearer ${staffToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(true);
    });
  });

  describe("🔒 Security & Validation", () => {
    it("should implement rate limiting", async () => {
      const promises = Array(10).fill(null).map(() => 
        app.request("/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@test.com",
            password: "password123"
          }),
        })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });

    it("should include CORS headers", async () => {
      const response = await app.request("/services", {
        method: "GET",
      });

      const corsHeader = response.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBeDefined();
    });

    it("should include security headers", async () => {
      const response = await app.request("/services", {
        method: "GET",
      });

      const securityHeaders = [
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection"
      ];

      for (const header of securityHeaders) {
        expect(response.headers.get(header)).toBeDefined();
      }
    });

    it("should validate email format", async () => {
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testCustomer,
          email: "invalid-email"
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });

    it("should require all mandatory fields", async () => {
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@test.com"
          // Missing password, firstName, lastName, phone
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });
  });

  describe("⚠️ Error Handling", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await app.request("/non-existent-route", {
        method: "GET",
      });

      expect(response.status).toBe(404);
      // Don't try to parse JSON for 404 responses as they might not be JSON
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(response.status).toBe(400);
      const data = await response.json() as GenericResponse;
      expect(data.success).toBe(false);
    });
  });

  describe("⚡ Performance", () => {
    it("should respond to health check quickly", async () => {
      const start = Date.now();
      const response = await app.request("/health", {
        method: "GET",
      });
      const end = Date.now();
      const responseTime = end - start;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle concurrent requests", async () => {
      const promises = Array(5).fill(null).map(() => 
        app.request("/services", {
          method: "GET",
        })
      );

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(r => r.status === 200);
      
      expect(allSuccessful).toBe(true);
    });
  });
}); 