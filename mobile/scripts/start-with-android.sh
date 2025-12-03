#!/bin/bash
# Start Expo with Android SDK environment loaded

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"

# Load Android SDK environment
export ANDROID_HOME="/mnt/c/Users/tampd/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/.local/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"

# Change to mobile directory
cd "$MOBILE_DIR" || exit 1

# Pass all arguments to expo
exec npx expo "$@"

