#!/usr/bin/env bun

import { spawn } from "child_process";
import { readdir } from "fs/promises";
import path from "path";

console.log("🚀 Starting Comprehensive Production Test Suite");
console.log("=" * 60);

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

async function runTest(testFile, description, isTypeScript = false) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running: ${description}`);
    console.log("-".repeat(40));
    
    const startTime = Date.now();
    const command = isTypeScript ? "bun" : "bun";
    const args = isTypeScript ? ["test", testFile] : ["run", testFile];
    
    const testProcess = spawn(command, args, {
      stdio: "pipe",
      shell: true
    });

    let output = "";
    let errorOutput = "";

    testProcess.stdout.on("data", (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    testProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    testProcess.on("close", (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result = {
        test: description,
        file: testFile,
        status: code === 0 ? "PASSED" : "FAILED",
        duration: `${duration}ms`,
        code: code,
        output: output,
        error: errorOutput
      };

      testResults.details.push(result);
      
      if (code === 0) {
        testResults.passed++;
        console.log(`✅ ${description} - PASSED (${duration}ms)`);
      } else {
        testResults.failed++;
        console.log(`❌ ${description} - FAILED (${duration}ms)`);
      }
      
      testResults.total++;
      resolve(result);
    });
  });
}

async function runAllTests() {
  const tests = [
    {
      file: "tests/production-test-suite.js",
      description: "Production Test Suite (JavaScript)",
      isTypeScript: false
    },
    {
      file: "tests/production-test-suite.test.ts",
      description: "Production Test Suite (TypeScript)",
      isTypeScript: true
    },
    {
      file: "tests/test-endpoints.js",
      description: "Legacy Endpoint Tests",
      isTypeScript: false
    },
    {
      file: "tests/test-appointments.js",
      description: "Appointments Tests",
      isTypeScript: false
    }
  ];

  console.log("📋 Test Plan:");
  tests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.description}`);
  });

  console.log("\n" + "=" * 60);
  console.log("🏃‍♂️ Executing Tests...");
  console.log("=" * 60);

  for (const test of tests) {
    try {
      await runTest(test.file, test.description, test.isTypeScript);
    } catch (error) {
      console.error(`❌ Error running ${test.description}:`, error.message);
      testResults.failed++;
      testResults.total++;
    }
  }

  // Generate comprehensive report
  generateReport();
}

function generateReport() {
  console.log("\n" + "=" * 60);
  console.log("📊 COMPREHENSIVE TEST REPORT");
  console.log("=" * 60);
  
  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📊 Total: ${testResults.total}`);
  console.log(`   📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.details
      .filter(result => result.status === "FAILED")
      .forEach(result => {
        console.log(`   • ${result.test} (${result.duration})`);
        if (result.error) {
          console.log(`     Error: ${result.error.trim()}`);
        }
      });
  }

  console.log(`\n✅ Passed Tests:`);
  testResults.details
    .filter(result => result.status === "PASSED")
    .forEach(result => {
      console.log(`   • ${result.test} (${result.duration})`);
    });

  // Production readiness assessment
  console.log("\n🔍 Production Readiness Assessment:");
  
  const readinessChecks = [
    {
      name: "Authentication & Authorization",
      status: testResults.details.some(r => r.test.includes("Authentication") && r.status === "PASSED")
    },
    {
      name: "User Management",
      status: testResults.details.some(r => r.test.includes("User") && r.status === "PASSED")
    },
    {
      name: "Services Management",
      status: testResults.details.some(r => r.test.includes("Services") && r.status === "PASSED")
    },
    {
      name: "Schedules Management",
      status: testResults.details.some(r => r.test.includes("Schedules") && r.status === "PASSED")
    },
    {
      name: "Appointments Management",
      status: testResults.details.some(r => r.test.includes("Appointments") && r.status === "PASSED")
    },
    {
      name: "Security & Validation",
      status: testResults.details.some(r => r.test.includes("Security") && r.status === "PASSED")
    },
    {
      name: "Error Handling",
      status: testResults.details.some(r => r.test.includes("Error") && r.status === "PASSED")
    },
    {
      name: "Performance",
      status: testResults.details.some(r => r.test.includes("Performance") && r.status === "PASSED")
    }
  ];

  let readyChecks = 0;
  readinessChecks.forEach(check => {
    const status = check.status ? "✅" : "❌";
    console.log(`   ${status} ${check.name}`);
    if (check.status) readyChecks++;
  });

  const readinessPercentage = (readyChecks / readinessChecks.length) * 100;
  
  console.log(`\n📊 Overall Production Readiness: ${readinessPercentage.toFixed(1)}%`);
  
  if (readinessPercentage >= 90) {
    console.log("🎉 EXCELLENT! API is production-ready!");
  } else if (readinessPercentage >= 75) {
    console.log("⚠️ GOOD! API is mostly production-ready with minor issues.");
  } else if (readinessPercentage >= 50) {
    console.log("⚠️ FAIR! API needs improvements before production deployment.");
  } else {
    console.log("❌ POOR! API is not ready for production deployment.");
  }

  // Recommendations
  if (testResults.failed > 0) {
    console.log("\n🔧 Recommendations:");
    console.log("   1. Review and fix failed tests");
    console.log("   2. Ensure all endpoints are properly tested");
    console.log("   3. Verify security measures are in place");
    console.log("   4. Check performance under load");
    console.log("   5. Validate error handling scenarios");
  }

  console.log("\n" + "=" * 60);
  console.log("🏁 Test Suite Complete");
  console.log("=" * 60);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n⚠️ Test execution interrupted by user");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n\n⚠️ Test execution terminated");
  process.exit(1);
});

// Run the comprehensive test suite
runAllTests().catch(error => {
  console.error("❌ Fatal error during test execution:", error);
  process.exit(1);
}); 