# Leining App

A web app for practising Torah reading (leining) with cantillation marks (ta'amim / trop).

## Features

- **Word-by-word playback** — step through the text at an adjustable speed
- **Ta'am display** — shows the cantillation mark name for the currently highlighted word
- **Two navigation modes**
  - *Manual* — choose any book, chapter, and verse range from the full Tanach
  - *Parasha* — load the current week's Torah portion directly from the Sefaria calendar
- **Progress persistence** — your last reading position is saved in the browser so you can pick up where you left off
- **Right-to-left Hebrew UI** with Frank Ruhl Libre typeface

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) |
| Language | TypeScript |
| Build tool | [Vite](https://vitejs.dev/) |
| Text source | [Sefaria API](https://www.sefaria.org/developers) |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Installation

```bash
npm install
```

### Development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
npm run build
```

The compiled output is placed in the `dist/` directory.

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Usage

1. **Select a passage** — use the *בחר קטע* (Manual) tab to pick a book, chapter, and verse range, or switch to *פרשת השבוע* (Weekly Parasha) to load the current Torah portion.
2. **Load** — press the *טען* button to fetch the Hebrew text from Sefaria.
3. **Read** — click the play button (▶) to advance through the words automatically, or click any word to jump to it.
4. **Adjust speed** — use the speed slider in the controls bar to set a comfortable pace.
5. **Ta'am panel** — the sidebar shows the name of the cantillation mark on the currently highlighted word.

## Project Structure

```
src/
├── components/       # React UI components
│   ├── Controls      # Playback controls (play/pause, speed)
│   ├── Navigation    # Book/chapter/parasha selector
│   ├── TaamPanel     # Cantillation mark display
│   └── TextDisplay   # Hebrew text with word highlighting
├── hooks/
│   └── usePlayback   # Playback state and timer logic
├── utils/
│   ├── hebrew.ts     # Hebrew text parsing helpers
│   ├── sefaria.ts    # Sefaria API client + book/parasha data
│   ├── storage.ts    # LocalStorage position persistence
│   └── taamim.ts     # Cantillation mark name and image maps
├── types.ts          # Shared TypeScript types
└── main.tsx          # App entry point
```

## License

This project is private. All rights reserved.
