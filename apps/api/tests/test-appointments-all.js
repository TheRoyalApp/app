#!/usr/bin/env bun

import { Hono } from "hono";
import appointmentsRouter from "../src/appoinments/appoinments.route.js";

// Create a test app with the appointments route
const app = new Hono();
app.route('/appointments', appointmentsRouter);

console.log("🧪 Testing Appointments All Endpoint...\n");

async function testAppointmentsAll() {
  try {
    // Test the /appointments/all endpoint
    const response = await app.request("/appointments/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
      }
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log("✅ /appointments/all endpoint test passed!");
      console.log("Response structure:", {
        success: data.success,
        hasData: !!data.data,
        dataLength: data.data?.length || 0
      });
      
      if (data.data && data.data.length > 0) {
        console.log("Sample appointment:", data.data[0]);
      }
    } else {
      console.log("❌ /appointments/all endpoint test failed!");
      const errorData = await response.json();
      console.log("Error response:", errorData);
    }
  } catch (error) {
    console.error("❌ Error testing /appointments/all endpoint:", error);
  }
}

testAppointmentsAll(); 