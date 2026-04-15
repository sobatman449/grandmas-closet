#!/bin/bash

# My Closet — macOS Launcher
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ── Check for Node.js ─────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  osascript -e 'display dialog "Node.js is not installed. Please go to https://nodejs.org and install it (click the LTS version), then try again." buttons {"OK"} default button "OK" with icon stop'
  exit 1
fi

# ── Check for git ─────────────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
  osascript -e 'display dialog "Git is not installed. Please go to https://git-scm.com and install it, then try again." buttons {"OK"} default button "OK" with icon stop'
  exit 1
fi

# ── Auto-update from GitHub ───────────────────────────────────────────────
echo "Checking for updates..."
if git remote get-url origin &>/dev/null 2>&1; then
  git fetch origin main --quiet 2>/dev/null
  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse origin/main 2>/dev/null)

  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Update found — pulling latest version..."
    git pull origin main --quiet 2>/dev/null
    touch "$DIR/.updated"
    npm install --silent
    osascript -e 'display notification "My Closet was updated to the latest version!" with title "My Closet 👗"'
  else
    echo "Already up to date."
  fi
fi

# ── Install dependencies if missing ──────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "First-time setup: installing dependencies..."
  npm install --silent
fi

# ── Get local IP address ──────────────────────────────────────────────────
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

# ── Find a free port ──────────────────────────────────────────────────────
PORT=3737
while lsof -i:$PORT &>/dev/null 2>&1; do
  PORT=$((PORT + 1))
done
export PORT=$PORT

# ── Start the server ──────────────────────────────────────────────────────
npm run dev > /tmp/mycloset.log 2>&1 &
SERVER_PID=$!

echo "Starting My Closet on port $PORT…"
for i in {1..30}; do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# ── Open desktop browser ──────────────────────────────────────────────────
open "http://localhost:$PORT"
osascript -e "display notification \"My Closet is open! Phone URL: http://$LOCAL_IP:$PORT\" with title \"My Closet 👗\""

# ── Print phone/tablet connection info ───────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "  ✅  My Closet is running!"
echo ""
echo "  💻  This computer:  http://localhost:$PORT"
echo "  📱  Phone / iPad:   http://$LOCAL_IP:$PORT"
echo ""
echo "  On your iPhone or iPad:"
echo "  1. Open Safari"
echo "  2. Go to: http://$LOCAL_IP:$PORT"
echo "  3. Tap Share → Add to Home Screen"
echo "═══════════════════════════════════════════"

# Print QR code if qrencode is available
if command -v qrencode &>/dev/null; then
  echo ""
  echo "  Scan with your phone camera:"
  echo ""
  qrencode -t ANSIUTF8 -s 1 "http://$LOCAL_IP:$PORT"
fi

echo ""
echo "  Close this window to stop the app."
echo ""

trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM EXIT
wait $SERVER_PID
