#!/usr/bin/env node

/**
 * Script helper để lấy IP network của máy tính
 * Sử dụng để set EXPO_PUBLIC_API_IP
 */

const { execSync } = require("child_process");
const os = require("os");

function getNetworkIP() {
  const platform = os.platform();
  let ip = null;

  try {
    if (platform === "darwin" || platform === "linux") {
      // macOS hoặc Linux
      const result = execSync(
        `ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1`,
        { encoding: "utf-8" }
      );
      ip = result.trim();
    } else if (platform === "win32") {
      // Windows
      const result = execSync(`ipconfig | findstr /i "IPv4"`, {
        encoding: "utf-8",
      });
      const matches = result.match(/IPv4.*?(\d+\.\d+\.\d+\.\d+)/);
      if (matches && matches[1]) {
        ip = matches[1];
      }
    }
  } catch (error) {
    console.error("Không thể lấy IP:", error.message);
  }

  return ip;
}

const ip = getNetworkIP();

if (ip) {
  console.log("\n✅ IP Network của máy tính:");
  console.log(`   ${ip}\n`);
  console.log("📝 Thêm vào file .env hoặc set environment variable:");
  console.log(`   EXPO_PUBLIC_API_IP=${ip}\n`);
  console.log("💡 Hoặc sử dụng trực tiếp trong EXPO_PUBLIC_API_URL:");
  console.log(`   EXPO_PUBLIC_API_URL=http://${ip}:3000/api\n`);
} else {
  console.error("\n❌ Không tìm thấy IP network.");
  console.log("\n💡 Hãy thử lệnh thủ công:");
  if (os.platform() === "win32") {
    console.log('   ipconfig | findstr /i "IPv4"');
  } else {
    console.log('   ifconfig | grep "inet " | grep -v 127.0.0.1');
  }
  console.log("");
}

process.exit(ip ? 0 : 1);
