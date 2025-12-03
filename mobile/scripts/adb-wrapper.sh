#!/bin/bash
# Wrapper script for adb.exe on Windows from WSL2
# This allows Expo to find and use adb from Windows Android SDK

ANDROID_HOME="${ANDROID_HOME:-/mnt/c/Users/tampd/AppData/Local/Android/Sdk}"
ADB_PATH="$ANDROID_HOME/platform-tools/adb.exe"

if [ -f "$ADB_PATH" ]; then
    # Convert WSL path to Windows path for execution
    exec "$ADB_PATH" "$@"
else
    echo "Error: adb.exe not found at $ADB_PATH" >&2
    echo "Please set ANDROID_HOME environment variable" >&2
    exit 1
fi

