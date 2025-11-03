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
    if (platform === "darwin") {
      // macOS - sử dụng ifconfig
      const result = execSync(
        `ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1`,
        { encoding: "utf-8" }
      );
      ip = result.trim();
    } else if (platform === "linux") {
      // Linux - ưu tiên sử dụng 'hostname -I' (đơn giản và có sẵn)
      try {
        const result = execSync(`hostname -I | awk '{print $1}'`, {
          encoding: "utf-8",
        });
        ip = result.trim();
        // Kiểm tra xem có phải là IP hợp lệ không
        if (!ip || !ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          throw new Error("IP không hợp lệ");
        }
      } catch (hostnameError) {
        // Fallback: thử dùng lệnh 'ip'
        try {
          const result = execSync(
            `ip -4 addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -1`,
            { encoding: "utf-8" }
          );
          ip = result.trim();
          if (!ip || !ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            throw new Error("IP không hợp lệ");
          }
        } catch (ipError) {
          // Fallback cuối cùng: thử ifconfig (nếu được cài đặt)
          try {
            const result = execSync(
              `ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1`,
              { encoding: "utf-8" }
            );
            ip = result.trim();
          } catch (ifconfigError) {
            // Không có phương pháp nào hoạt động
            ip = null;
          }
        }
      }
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
  console.log(`   EXPO_PUBLIC_API_URL=http://${ip}:3333/api\n`);
} else {
  console.error("\n❌ Không tìm thấy IP network.");
  console.log("\n💡 Hãy thử lệnh thủ công:");
  if (os.platform() === "win32") {
    console.log('   ipconfig | findstr /i "IPv4"');
  } else if (os.platform() === "linux") {
    console.log("   hostname -I | awk '{print $1}'");
    console.log(
      "   hoặc: ip -4 addr show | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1"
    );
  } else {
    console.log('   ifconfig | grep "inet " | grep -v 127.0.0.1');
  }
  console.log("");
}

process.exit(ip ? 0 : 1);
