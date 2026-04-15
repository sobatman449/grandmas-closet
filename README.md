# 👗 My Closet

A personal virtual wardrobe organizer — built with love.

## Features

- **The Rack** — Tops, bottoms, dresses hang on a scrollable rail. Shoes, bags, jewelry, and intimates on their own shelves.
- **Background Removal** — Upload any photo and the app removes the background automatically, 100% in-browser (no cloud, no API, fully private).
- **Outfits** — Assemble looks from closet pieces. Tag by occasion (casual, work, travel, formal, special event).
- **Suitcases** — Plan what to pack for each trip. Add individual pieces or whole outfits.
- **Try-On** — Upload a photo of yourself, then drag and resize clothing pieces on top of it to preview looks.

## Quick Start

### Mac
Double-click `launch-mac.command`  
(First run: right-click → Open if macOS warns about unverified developer)

### Windows
Double-click `launch-windows.bat`

### Manual (any platform)
```bash
npm install
npm run dev
# Open http://localhost:5000
```

## Requirements

- [Node.js](https://nodejs.org) LTS (v18+)
- A modern browser (Chrome, Edge, Safari, Firefox)

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js
- **Database:** SQLite (local, stored in `closet.db`)
- **BG Removal:** [@imgly/background-removal](https://www.npmjs.com/package/@imgly/background-removal) — ONNX model, runs in-browser via WebAssembly/WebGPU

## Privacy

All data lives on your computer. Photos never leave your machine.
