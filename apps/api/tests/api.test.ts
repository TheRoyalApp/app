import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";

// Import the Hono app directly from the routes
import authRouter from "../src/auth/auth.route";
import usersRouter from "../src/users/users.route";
import type { User } from "../src/users/users";

// Create a test app with the routes
const app = new Hono();
app.route('/auth', authRouter);
app.route('/users', usersRouter);

// Test data
const testUser = {
  email: "test@example.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890"
};

let authToken = "";
let userId = "";

describe("API Endpoints", () => {
  describe("Auth Endpoints", () => {
    describe("POST /auth/signup", () => {
      it("should create a new user successfully", async () => {
        const response = await app.request("/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testUser),
        });

        expect(response.status).toBe(200);
        const data = await response.json() as { success: boolean, data: { userResponse: User, tokens: { token: string, refreshToken: string } } };
        expect(data.success).toBe(true);
        expect(data.data.userResponse).toBeDefined();
        expect(data.data.tokens).toBeDefined();
        expect(data.data.tokens.token).toBeDefined();
        expect(data.data.tokens.refreshToken).toBeDefined();
        
        // Store user ID and token for later tests
        userId = data.data.userResponse.id;
        authToken = data.data.tokens.token;
      });

      it("should fail with duplicate email", async () => {
        const response = await app.request("/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testUser),
        });

        expect(response.status).toBe(400);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
      });
    });

    describe("POST /auth/signin", () => {
      it("should sign in successfully with valid credentials", async () => {
        const response = await app.request("/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json() as { success: boolean, data: { user: User, tokens: { token: string, refreshToken: string } } };
        expect(data.success).toBe(true);
        expect(data.data.user).toBeDefined();
        expect(data.data.tokens).toBeDefined();
        expect(data.data.tokens.token).toBeDefined();
        expect(data.data.tokens.refreshToken).toBeDefined();
      });

      it("should fail with invalid email", async () => {
        const response = await app.request("/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "password123",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
        expect(data.message).toBe("Invalid credentials");
      });

      it("should fail with invalid password", async () => {
        const response = await app.request("/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "wrongpassword",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
        expect(data.message).toBe("Invalid password");
      });
    });
  });

  describe("Users Endpoints", () => {
    describe("POST /users/new", () => {
      it("should create a new user successfully", async () => {
        const newUser = {
          email: "newuser@example.com",
          password: "password123",
          firstName: "New",
          lastName: "User",
          phone: "+1234567891"
        };

        const response = await app.request("/users/new", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        });

        expect(response.status).toBe(201);
        const data = await response.json() as { success: boolean, data: User };
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      });
    });

    describe("GET /users/:id", () => {
      it("should get user by ID with valid token", async () => {
        const response = await app.request(`/users/${userId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json() as { success: boolean, data: User };
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.id).toBe(userId);
      });

      it("should fail without authentication token", async () => {
        const response = await app.request(`/users/${userId}`, {
          method: "GET",
        });

        expect(response.status).toBe(401);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
        expect(data.message).toBe("Authorization header is required");
      });

      it("should fail with invalid token", async () => {
        const response = await app.request(`/users/${userId}`, {
          method: "GET",
          headers: {
            "Authorization": "Bearer invalid-token",
          },
        });

        expect(response.status).toBe(401);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
        expect(data.message).toBe("Invalid or expired token");
      });

      it("should fail with non-existent user ID", async () => {
        const response = await app.request("/users/non-existent-id", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        expect(response.status).toBe(404);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
        expect(data.message).toBe("User not found");
      });
    });

    describe("GET /users/all", () => {
      it("should fail without admin privileges", async () => {
        const response = await app.request("/users/all", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        expect(response.status).toBe(403);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
        expect(data.message).toBe("Access denied. Admin privileges required.");
      });

      it("should fail without authentication", async () => {
        const response = await app.request("/users/all", {
          method: "GET",
        });

        expect(response.status).toBe(401);
        const data = await response.json() as { success: boolean, message: string };
        expect(data.success).toBe(false);
        expect(data.message).toBe("Authorization header is required");
      });
    });
  });

  describe("Authentication Middleware", () => {
    it("should reject requests with invalid Authorization format", async () => {
      const response = await app.request(`/users/${userId}`, {
        method: "GET",
        headers: {
          "Authorization": "InvalidFormat token",
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json() as { success: boolean, message: string };
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid authorization header format. Use: Bearer <token>");
    });

    it("should reject requests with empty token", async () => {
      const response = await app.request(`/users/${userId}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer ",
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json() as { success: boolean, message: string } ;
      expect(data.success).toBe(false);
      expect(data.message).toBe("Token is required");
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent routes", async () => {
      const response = await app.request("/non-existent-route", {
        method: "GET",
      });

      expect(response.status).toBe(404);
    });

    it("should handle unsupported HTTP methods", async () => {
      const response = await app.request("/auth/signup", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testUser),
      });

      expect(response.status).toBe(404);
    });
  });
}); 