#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// List of services that have Prisma
const servicesWithPrisma = [
  "auth-service",
  "vehicle-service",
  "booking-service",
  "payment-service",
  "review-service",
];

console.log("🚀 Starting Prisma Generate for all services...\n");

let successCount = 0;
let errorCount = 0;
const results = [];

for (const service of servicesWithPrisma) {
  const servicePath = path.join(__dirname, "..", "apps", service);
  const prismaPath = path.join(servicePath, "prisma");

  console.log(`📁 Checking ${service}...`);

  // Check if prisma directory exists
  if (!fs.existsSync(prismaPath)) {
    console.log(`❌ ${service}: No prisma directory found\n`);
    continue;
  }

  // Check if schema.prisma exists
  const schemaPath = path.join(prismaPath, "schema.prisma");
  if (!fs.existsSync(schemaPath)) {
    console.log(`❌ ${service}: No schema.prisma found\n`);
    continue;
  }

  try {
    console.log(`🔄 Generating Prisma client for ${service}...`);

    // Change to service directory and run prisma generate
    execSync("npx prisma generate", {
      cwd: servicePath,
      stdio: "inherit",
    });

    console.log(`✅ ${service}: Prisma client generated successfully\n`);
    successCount++;
    results.push({ service, status: "success" });
  } catch (error) {
    console.log(`❌ ${service}: Failed to generate Prisma client`);
    console.log(`   Error: ${error.message}\n`);
    errorCount++;
    results.push({ service, status: "error", error: error.message });
  }
}

// Summary
console.log("📊 Summary:");
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${errorCount}`);
console.log(`📁 Total checked: ${servicesWithPrisma.length}\n`);

// Detailed results
if (results.length > 0) {
  console.log("📋 Detailed Results:");
  results.forEach((result) => {
    const icon = result.status === "success" ? "✅" : "❌";
    console.log(`${icon} ${result.service}: ${result.status}`);
    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  });
}

// Exit with error code if any failed
if (errorCount > 0) {
  console.log("\n❌ Some services failed to generate Prisma clients");
  process.exit(1);
} else {
  console.log("\n🎉 All Prisma clients generated successfully!");
  process.exit(0);
}
