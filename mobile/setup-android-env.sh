#!/bin/bash
# Setup Android SDK environment for WSL2 using Windows Android Studio

export ANDROID_HOME="/mnt/c/Users/tampd/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/.local/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"

echo "✓ Android SDK environment configured"
echo "  ANDROID_HOME: $ANDROID_HOME"
echo "  ADB wrapper: $(which adb 2>/dev/null || echo 'not found')"
echo "  ADB version: $(adb version 2>&1 | head -1 || echo 'error running adb')"

