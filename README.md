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
- **Sefer Torah mode** to see which aliyah is how long

## Screenshots

Choose a parasha:

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-15" src="https://github.com/user-attachments/assets/abadd92a-6dcc-463d-bd62-d43641659880" />

Read along (or ahead) in your own set pace (WPM = words per minute):

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-26" src="https://github.com/user-attachments/assets/c7dd2fcb-e514-4fcd-a7e9-4a427327ad4b" />

Sefer Torah mode (with aliyos showing):

<img width="1920" height="1080" alt="Screenshot from 2026-03-26 23-43-34" src="https://github.com/user-attachments/assets/47756a5a-7815-4f60-bb43-e31fa2f8a402" />

## Hand-sign (trop) videos

While reading, the app converts each word's ta'am to a hand-sign name (e.g. `mercha`, `tipcha`, `etnachta`) and plays the clip matching the **longest sequence** that starts at the current word (within one verse). Enable it with the "סרטון טעמים" checkbox.

### Adding a clip

1. Name the file after the sequence, signs joined by `_`, lowercase: `src/assets/taam-videos/mercha_tipcha_etnachta.mp4`. A single sign is a one-element sequence: `munach.mp4`.
2. Drop it into `src/assets/taam-videos/` (`.mp4` or `.webm`). Files starting with `_` are ignored.
3. Restart `npm run dev` (or rebuild). No code changes or manifest needed.

Sign names (also in `TAAM_SLUGS` in `src/utils/taamim.ts`): etnachta, segol, shalshelet, zakef-katon, zakef-gadol, tipcha, revia, zarka, pashta, yetiv, tevir, geresh, geresh-muqdam, gershayim, karnei-para, telisha-gedola, pazer, etnachta-hafuch, munach, mapach, mercha, mercha-kefula, darga, kadma, telisha-ketana, yerach-ben-yomo, ole, iluy, dechi, zinor, and `silluk` (last word of a verse). Example sequence: `mercha_tipcha_etnachta`.

### Recommended format

MP4 (H.264, `yuv420p`, no audio), 480p, 30 fps, 2–5 s, short keyframe interval for fast starts and switching. The same framing and background in every clip avoids visual jumps. The clip's playback rate is adjusted (0.5×–2×) to fit the current reading speed.

```bash
ffmpeg -i in.mov -an -vf scale=-2:480 -r 30 -c:v libx264 -pix_fmt yuv420p \
  -crf 26 -g 15 -movflags +faststart mercha_tipcha_etnachta.mp4
```

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
