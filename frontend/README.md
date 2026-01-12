# Leining App - Frontend

Modern React + TypeScript frontend for the Torah Reading Practice application.

## Features

- **Real-Time Audio Recording** using Web Audio API
- **Hebrew Text Display** with RTL support and optional Nikud
- **Reference Audio Upload** for practice materials
- **Live Transcription Feedback** from backend
- **Similarity Scoring** and comparison with reference text
- **Visual Feedback** with flash animations for marker words
- **Modern UI** with responsive design

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Web Audio API** for audio recording
- **WebSocket** for real-time communication (optional)
- **CSS3** for animations and RTL support

## Prerequisites

- Node.js 18+ (or compatible version)
- npm or yarn
- Backend server running on `http://localhost:8000`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building for Production

Build the production-ready app:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── HebrewText.tsx        # Hebrew text display with RTL
│   │   ├── AudioRecorder.tsx     # Audio recording component
│   │   ├── ReferenceAudioUpload.tsx  # File upload component
│   │   └── Settings.tsx          # Settings panel
│   ├── hooks/
│   │   ├── useAudioRecorder.ts   # Audio recording hook
│   │   └── useWebSocket.ts       # WebSocket hook
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # App styles
│   ├── index.css                 # Global styles
│   └── main.tsx                  # App entry point
├── public/                       # Static assets
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config
└── README.md                     # This file
```

## Key Components

### HebrewText
Displays Hebrew text with proper RTL support, optional Nikud display, and flash animations.

### AudioRecorder
Handles microphone access, audio recording, and playback using the Web Audio API.

### ReferenceAudioUpload
Allows users to upload reference audio files for practice verses.

### Settings
Configuration panel for:
- Whisper model selection
- Reference verse text
- Marker word configuration
- Display options

## Custom Hooks

### useAudioRecorder
Manages audio recording state and MediaRecorder API interactions.

### useWebSocket
Handles WebSocket connection for real-time audio streaming (optional feature).

## API Integration

The frontend communicates with the backend via:

- **REST API** for:
  - Audio transcription
  - Text comparison
  - Marker detection
  - Reference audio upload

- **WebSocket** (optional) for:
  - Real-time audio streaming
  - Live transcription updates

## Styling

The app uses:
- CSS custom properties for theming
- Flexbox and Grid for layout
- CSS animations for visual feedback
- RTL (right-to-left) support for Hebrew text
- Responsive design for mobile and desktop

## Browser Compatibility

Requires a modern browser with support for:
- ES2020+ features
- Web Audio API
- MediaRecorder API
- WebSocket (for real-time features)

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Tips

### Hot Module Replacement
Vite provides fast HMR for instant feedback during development.

### TypeScript
The project uses strict TypeScript for better type safety and developer experience.

### Proxy Configuration
Vite is configured to proxy API requests to `localhost:8000` for seamless development.

## Troubleshooting

### Microphone Access
If microphone access is denied:
1. Check browser permissions
2. Ensure HTTPS or localhost
3. Grant microphone access when prompted

### API Connection Issues
If the backend API is not responding:
1. Ensure backend server is running on port 8000
2. Check CORS configuration in backend
3. Verify proxy settings in `vite.config.ts`

## Future Enhancements

- Real-time streaming mode with WebSocket
- User authentication and progress tracking
- Multi-language support
- Offline mode with service workers
- Advanced audio visualization

## License

This project is open source and available for use in Torah study and practice.
