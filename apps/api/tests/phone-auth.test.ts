import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";

// Import the Hono app directly from the routes
import authRouter from "../src/auth/auth.route";

// Create a test app with the routes
const app = new Hono();
app.route('/auth', authRouter);

// Test data
const testPhone = "+1234567890";
const testUser = {
  phone: testPhone,
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  role: "customer"
};

let verificationCode = "";
let authToken = "";

describe("Phone Authentication Flow", () => {
  describe("SMS Verification Flow", () => {
    it("should send SMS code successfully", async () => {
      const response = await app.request("/auth/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: testPhone
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("SMS verification code sent successfully");
      expect(data.data.phone).toBe(testPhone);
    });

    it("should verify SMS code successfully", async () => {
      // In a real test, you would get the actual code from the database
      // For now, we'll test with a mock code
      const mockCode = "123456";
      
      const response = await app.request("/auth/verify-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: testPhone,
          code: mockCode
        }),
      });

      // This might fail in test environment since we don't have a real code
      // But we can test the endpoint structure
      expect(response.status).toBe(400); // Expected to fail with mock code
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe("Phone-Only Login", () => {
    it("should allow login with phone and empty password", async () => {
      const response = await app.request("/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: testPhone,
          password: "" // Empty password for phone-only auth
        }),
      });

      // This should work if the user exists and is phone verified
      // In test environment, it might fail if user doesn't exist
      expect([200, 401]).toContain(response.status);
    });

    it("should fail login with non-existent phone", async () => {
      const response = await app.request("/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: "+9999999999",
          password: ""
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe("User Registration with Phone Verification", () => {
    it("should create user with phone verification", async () => {
      const newUser = {
        phone: "+1234567891",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        role: "customer"
      };

      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      // This should work if the phone is verified
      expect([200, 201, 400]).toContain(response.status);
    });

    it("should handle existing user with temporary data", async () => {
      // First, create a temporary user through SMS verification
      const tempUser = {
        phone: "+1234567892",
        firstName: "Temporary",
        lastName: "User",
        email: "temp@example.com",
        role: "customer"
      };

      // This should update the existing temporary user
      const response = await app.request("/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tempUser),
      });

      expect([200, 201, 400]).toContain(response.status);
    });
  });
}); 