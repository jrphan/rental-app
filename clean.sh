#!/bin/bash
# Cleanup node_modules và lockfiles dư thừa trong monorepo

echo "🧹 Cleaning up node_modules and lockfiles..."

# Xóa toàn bộ node_modules trong repo (bao gồm root và sub-packages)
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Xóa các lockfile npm/yarn thừa (chỉ giữ pnpm-lock.yaml)
find . -name "package-lock.json" -type f -delete
find . -name "yarn.lock" -type f -delete

# Cài lại dependencies bằng pnpm
pnpm install

echo "✅ Done! Only pnpm-lock.yaml is used now."
