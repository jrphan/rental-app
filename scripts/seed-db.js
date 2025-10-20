#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// List of services that have Prisma
const servicesWithPrisma = [
  "auth-service",
  "booking-service",
  "file-upload-service",
  "location-service",
  "notification-service",
  "payment-service",
  "review-service",
  "vehicle-service",
];

console.log("🚀 Starting Prisma DB Seed for all services...\n");

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

  // Check if seed file exists
  const seedPath = path.join(prismaPath, "seed.js");
  const seedTsPath = path.join(prismaPath, "seed.ts");

  if (!fs.existsSync(seedPath) && !fs.existsSync(seedTsPath)) {
    console.log(`⚠️  ${service}: No seed file found (seed.js or seed.ts)\n`);
    continue;
  }

  try {
    console.log(`🔄 Seeding database for ${service}...`);

    execSync("npx prisma db seed", {
      cwd: servicePath,
      stdio: "inherit",
    });

    console.log(`✅ ${service}: Database seeded successfully\n`);
    successCount++;
    results.push({ service, status: "success" });
  } catch (error) {
    console.log(`❌ ${service}: Failed to seed database`);
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
  console.log("\n❌ Some services failed to seed database");
  process.exit(1);
} else {
  console.log("\n🎉 All databases seeded successfully!");
  process.exit(0);
}
