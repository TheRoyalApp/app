#!/usr/bin/env bun

import { Hono } from "hono";
import authRouter from "../src/auth/auth.route.js";
import usersRouter from "../src/users/users.route.js";

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
  phone: "+1234567890",
  role: "customer"
};

let authToken = "";
let userId = "";

console.log("🧪 Starting API Endpoint Tests...\n");

async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  function test(name, testFn) {
    totalTests++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  // Auth Endpoints Tests
  console.log("📋 Testing Auth Endpoints");
  console.log("=" * 50);

  test("POST /auth/signup - Create new user", async () => {
    const response = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error("Expected success to be true");
    }

    if (!data.data.userResponse) {
      throw new Error("Expected userResponse in data");
    }

    if (!data.data.tokens || !data.data.tokens.token) {
      throw new Error("Expected tokens in data");
    }

    // Store for later tests
    userId = data.data.userResponse.id;
    authToken = data.data.tokens.token;
  });

  test("POST /auth/signup - Verify role field is set", async () => {
    const userWithRole = {
      email: "staff@example.com",
      password: "password123",
      firstName: "Staff",
      lastName: "Member",
      phone: "+1234567892",
      role: "staff"
    };

    const response = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userWithRole),
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error("Expected success to be true");
    }

    if (data.data.userResponse.role !== "staff") {
      throw new Error(`Expected role "staff", got "${data.data.userResponse.role}"`);
    }
  });

  test("POST /auth/signup - Default role when not specified", async () => {
    const userWithoutRole = {
      email: "customer@example.com",
      password: "password123",
      firstName: "Customer",
      lastName: "User",
      phone: "+1234567893"
    };

    const response = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userWithoutRole),
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error("Expected success to be true");
    }

    if (data.data.userResponse.role !== "customer") {
      throw new Error(`Expected role "customer", got "${data.data.userResponse.role}"`);
    }
  });

  test("POST /auth/signup - Duplicate email should fail", async () => {
    const response = await app.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }
  });

  test("POST /auth/signin - Valid credentials", async () => {
    const response = await app.request("/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error("Expected success to be true");
    }

    if (!data.data.user) {
      throw new Error("Expected user in data");
    }

    if (!data.data.tokens || !data.data.tokens.token) {
      throw new Error("Expected tokens in data");
    }
  });

  test("POST /auth/signin - Invalid email", async () => {
    const response = await app.request("/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "password123",
      }),
    });

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Invalid credentials") {
      throw new Error(`Expected "Invalid credentials", got "${data.message}"`);
    }
  });

  test("POST /auth/signin - Invalid password", async () => {
    const response = await app.request("/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "wrongpassword",
      }),
    });

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Invalid password") {
      throw new Error(`Expected "Invalid password", got "${data.message}"`);
    }
  });

  // Users Endpoints Tests
  console.log("\n📋 Testing Users Endpoints");
  console.log("=" * 50);

  test("POST /users/new - Create new user", async () => {
    const newUser = {
      email: "newuser@example.com",
      password: "password123",
      firstName: "New",
      lastName: "User",
      phone: "+1234567891",
      role: "staff"
    };

    const response = await app.request("/users/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error("Expected success to be true");
    }

    if (!data.data) {
      throw new Error("Expected data in response");
    }
  });

  test("GET /users/:id - Get user with valid token", async () => {
    const response = await app.request(`/users/${userId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` },
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error("Expected success to be true");
    }

    if (!data.data) {
      throw new Error("Expected data in response");
    }

    if (data.data.id !== userId) {
      throw new Error(`Expected user ID ${userId}, got ${data.data.id}`);
    }
  });

  test("GET /users/:id - No authentication token", async () => {
    const response = await app.request(`/users/${userId}`, {
      method: "GET",
    });

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Authorization header is required") {
      throw new Error(`Expected "Authorization header is required", got "${data.message}"`);
    }
  });

  test("GET /users/:id - Invalid token", async () => {
    const response = await app.request(`/users/${userId}`, {
      method: "GET",
      headers: { "Authorization": "Bearer invalid-token" },
    });

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Invalid or expired token") {
      throw new Error(`Expected "Invalid or expired token", got "${data.message}"`);
    }
  });

  test("GET /users/:id - Non-existent user", async () => {
    const response = await app.request("/users/non-existent-id", {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` },
    });

    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "User not found") {
      throw new Error(`Expected "User not found", got "${data.message}"`);
    }
  });

  test("GET /users/all - No admin privileges", async () => {
    const response = await app.request("/users/all", {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` },
    });

    if (response.status !== 403) {
      throw new Error(`Expected status 403, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Access denied. Admin privileges required.") {
      throw new Error(`Expected "Access denied. Admin privileges required.", got "${data.message}"`);
    }
  });

  test("GET /users/all - No authentication", async () => {
    const response = await app.request("/users/all", {
      method: "GET",
    });

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Authorization header is required") {
      throw new Error(`Expected "Authorization header is required", got "${data.message}"`);
    }
  });

  // Authentication Middleware Tests
  console.log("\n📋 Testing Authentication Middleware");
  console.log("=" * 50);

  test("Invalid Authorization format", async () => {
    const response = await app.request(`/users/${userId}`, {
      method: "GET",
      headers: { "Authorization": "InvalidFormat token" },
    });

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Invalid authorization header format. Use: Bearer <token>") {
      throw new Error(`Expected "Invalid authorization header format. Use: Bearer <token>", got "${data.message}"`);
    }
  });

  test("Empty token", async () => {
    const response = await app.request(`/users/${userId}`, {
      method: "GET",
      headers: { "Authorization": "Bearer " },
    });

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      throw new Error("Expected success to be false");
    }

    if (data.message !== "Token is required") {
      throw new Error(`Expected "Token is required", got "${data.message}"`);
    }
  });

  // Error Handling Tests
  console.log("\n📋 Testing Error Handling");
  console.log("=" * 50);

  test("Non-existent route", async () => {
    const response = await app.request("/non-existent-route", {
      method: "GET",
    });

    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }
  });

  test("Unsupported HTTP method", async () => {
    const response = await app.request("/auth/signup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }
  });

  // Test Summary
  console.log("\n📊 Test Summary");
  console.log("=" * 50);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed!");
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
}); 