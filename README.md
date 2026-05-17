# 👗 My Closet

A personal virtual wardrobe organizer — built with love.

## Features

- **The Rack** — Tops, bottoms, dresses hang on a scrollable rail. Shoes, bags, jewelry, and intimates on their own shelves.
- **Background Removal** — Upload any photo and the app removes the background automatically, 100% in-browser (no cloud, no API, fully private).
- **Outfits** — Assemble looks from closet pieces. Tag by occasion (casual, work, travel, formal, special event).
- **Suitcases** — Plan what to pack for each trip. Add individual pieces or whole outfits.
- **Try-On** — Upload a photo of yourself, then drag and resize clothing pieces on top of it to preview looks.

## Install (Windows)

1. Download `Grandma's Closet Setup.exe` from the [latest GitHub release](../../releases/latest) (or the Actions artifact after a build).
2. Double-click to install. It creates a desktop shortcut and a Start Menu entry.
3. Open from the desktop icon. The app icon appears in the taskbar while running.

All data lives in `%APPDATA%\Grandma's Closet\closet.db`. Nothing leaves the machine.

## Build the Windows Installer

Builds run on GitHub Actions (`.github/workflows/build.yml`):

- **Automatic** — push to `main`.
- **Manual** — Actions tab → "Build Windows Installer" → Run workflow.

Download the `.exe` from the workflow run's artifacts.

## Develop Locally

```bash
npm install
npm run dev            # browser at http://localhost:5001
npm run electron:dev   # run inside the Electron shell
```

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js
- **Database:** SQLite (better-sqlite3, local)
- **Shell:** Electron + electron-builder (one-click NSIS installer)
- **BG Removal:** [@imgly/background-removal](https://www.npmjs.com/package/@imgly/background-removal) — runs in-browser via WebAssembly/WebGPU
