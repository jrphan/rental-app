#!/bin/bash
# Expo wrapper that loads Android SDK environment before running Expo

# Load Android SDK environment
export ANDROID_HOME="/mnt/c/Users/tampd/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/.local/bin:$HOME/android-platform-tools:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"

# Change to mobile directory
cd "$MOBILE_DIR" || exit 1

# Run expo with all passed arguments
exec npx expo "$@"

