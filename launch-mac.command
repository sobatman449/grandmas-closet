#!/bin/bash

# My Closet — macOS Launcher
# Double-click this file to open your closet app in the browser.

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
# Only attempt if we're inside a git repo with a remote
if git remote get-url origin &>/dev/null 2>&1; then
  git fetch origin main --quiet 2>/dev/null
  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse origin/main 2>/dev/null)

  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Update found — pulling latest version..."
    git pull origin main --quiet 2>/dev/null
    touch "$DIR/.updated"
    # Re-run npm install in case dependencies changed
    npm install --silent
    osascript -e 'display notification "My Closet was updated to the latest version!" with title "My Closet 👗"'
  else
    echo "Already up to date."
  fi
else
  echo "No git remote found — skipping update check."
fi

# ── Install dependencies if node_modules missing ──────────────────────────
if [ ! -d "node_modules" ]; then
  echo "First-time setup: installing dependencies..."
  npm install --silent
fi

# ── Find a free port (default 3737) ──────────────────────────────────────
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

# ── Open in browser ───────────────────────────────────────────────────────
open "http://localhost:$PORT"
osascript -e "display notification \"My Closet is open in your browser!\" with title \"My Closet 👗\""

echo ""
echo "✅  My Closet is running at http://localhost:$PORT"
echo "    Close this window to stop the app."
echo ""

trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM EXIT
wait $SERVER_PID
