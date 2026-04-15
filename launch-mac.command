#!/bin/bash

# My Closet — macOS Launcher
# Double-click this file to open your closet app in the browser.

# Find the directory where this script lives
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ── Check for Node.js ─────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  osascript -e 'display dialog "Node.js is not installed. Please go to https://nodejs.org and install it (click the LTS version), then try again." buttons {"OK"} default button "OK" with icon stop'
  exit 1
fi

# ── Install dependencies if needed ────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  osascript -e 'display notification "Installing app dependencies for the first time. This takes about a minute…" with title "My Closet"'
  npm install --silent
fi

# ── Find a free port (default 3737) ───────────────────────────────────────
PORT=3737
while lsof -i:$PORT &>/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

export PORT=$PORT

# ── Start the server in the background ────────────────────────────────────
npm run dev > /tmp/mycloset.log 2>&1 &
SERVER_PID=$!

# ── Wait for it to be ready ────────────────────────────────────────────────
echo "Starting My Closet on port $PORT…"
for i in {1..30}; do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# ── Open in browser ────────────────────────────────────────────────────────
open "http://localhost:$PORT"

osascript -e "display notification \"My Closet is open in your browser at localhost:$PORT\" with title \"My Closet 👗\""

# ── Keep script alive — closing Terminal window kills the server ───────────
echo ""
echo "✅  My Closet is running at http://localhost:$PORT"
echo "    Close this window to stop the app."
echo ""

# Trap Ctrl+C or window close to kill server
trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM EXIT

wait $SERVER_PID
