#!/usr/bin/env bun

import { Hono } from "hono";
import appointmentsRouter from "../src/appoinments/appoinments.route.js";

// Create a test app with the appointments route
const app = new Hono();
app.route('/appointments', appointmentsRouter);

console.log("🧪 Testing Appointments Endpoint...\n");

async function testAppointments() {
  try {
    const response = await app.request("/appointments/", {
      method: "GET",
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log("Response:", data);
      console.log("✅ Appointments endpoint test passed!");
    } else {
      console.log("❌ Appointments endpoint test failed!");
    }
  } catch (error) {
    console.error("❌ Error testing appointments endpoint:", error);
  }
}

testAppointments(); 