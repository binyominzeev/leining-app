# Leining App - Torah Reading Practice

A modern, real-time web application to help users practice Torah reading (leining) with speech-to-text feedback, reference audio comparison, and visual cues.

## 🌟 Features

- **Real-Time Feedback**: Live speech-to-text transcription as you read Torah verses aloud
- **Reference Audio Upload**: Upload and compare against professionally read Torah verses
- **Hebrew Text Processing**: Full support for RTL display and Nikud (vowel marks)
- **Text Comparison**: Intelligent comparison between your reading and reference text
- **Visual Feedback**: Flash animations when reaching marker words (Etnahta, Sof Pasuk)
- **Modern Architecture**: React frontend + FastAPI backend with WebSocket support

## 🏗️ Architecture

This is a monorepo application with two main components:

```
leining-app/
├── backend/          # FastAPI server with speech-to-text
│   ├── main.py
│   ├── logic.py
│   ├── requirements.txt
│   └── README.md
├── frontend/         # React + TypeScript UI
│   ├── src/
│   ├── package.json
│   └── README.md
├── app.py           # Legacy Streamlit app (deprecated)
├── logic.py         # Original logic (reference)
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** for the backend
- **Node.js 18+** for the frontend
- **npm** or **yarn** package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

**API Documentation**: Visit `http://localhost:8000/docs` for interactive Swagger UI

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📖 How to Use

1. **Configure Settings** (in the right sidebar):
   - Load the Whisper model (start with "tiny" for faster processing)
   - Set your reference Hebrew verse with Nikud
   - Set the marker word that triggers visual feedback

2. **Upload Reference Audio** (optional):
   - Use the reference audio upload section
   - Provide a verse ID and select an audio file

3. **Practice Reading**:
   - View the Hebrew text displayed in RTL format
   - Click "Start Recording" to record your voice
   - Click "Stop Recording" when done

4. **Get Feedback**:
   - See your transcription displayed in Hebrew
   - View the similarity score compared to the reference
   - See a flash animation when you reach the marker word

## 🔧 Technical Stack

### Backend
- **FastAPI**: Modern, fast web framework for Python
- **Faster-Whisper**: Efficient speech-to-text engine (Hebrew support)
- **WebSocket**: Real-time audio streaming support
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server for production

### Frontend
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Web Audio API**: Browser-based audio recording
- **CSS3**: RTL support and animations

### Original (Legacy)
- **Streamlit**: Interactive web app framework (see `app.py`)

## 📁 Project Structure

### Backend (`/backend`)
- `main.py`: FastAPI application with REST and WebSocket endpoints
- `logic.py`: Hebrew text processing utilities
- `requirements.txt`: Python dependencies
- `reference_audio/`: Uploaded reference audio files

### Frontend (`/frontend`)
- `src/components/`: React components (HebrewText, AudioRecorder, Settings, etc.)
- `src/hooks/`: Custom React hooks (useAudioRecorder, useWebSocket)
- `src/App.tsx`: Main application component
- `src/index.css`: Global styles with RTL support

## 🧪 Testing

### Backend Tests
```bash
python test_logic.py
```

### Frontend Tests
```bash
cd frontend
npm run lint
```

## 🌐 API Endpoints

### Health & Status
- `GET /` - Health check
- `GET /api/health` - Detailed health status

### Model Management
- `POST /api/model/load?model_size=tiny` - Load Whisper model

### Audio Processing
- `POST /api/audio/upload` - Upload reference audio
- `POST /api/transcribe` - Transcribe audio to Hebrew text

### Text Comparison
- `POST /api/compare` - Compare Hebrew texts
- `POST /api/marker/check` - Check if marker word is reached

### WebSocket
- `WS /ws/audio` - Real-time audio streaming

See `backend/README.md` for detailed API documentation.

## 🎨 Features in Detail

### Hebrew Text Processing
- **Nikud Removal**: Strip vowel marks for comparison
- **Normalization**: Whitespace and character normalization
- **RTL Support**: Proper right-to-left text display
- **Word Comparison**: Intelligent similarity scoring

### Audio Features
- **Microphone Recording**: Web Audio API integration
- **Multiple Formats**: Support for WAV, MP3, WebM
- **Reference Audio**: Upload and store verse recordings
- **Forced Alignment**: (Future) Timing alignment with reference

### Visual Feedback
- **Flash Animations**: Green flash when reaching markers
- **Pulse Icons**: Animated visual cues
- **Similarity Scores**: Percentage-based feedback
- **Real-time Updates**: Live transcription display

## 🔮 Future Enhancements

- [ ] User authentication and progress tracking
- [ ] Forced alignment between audio and text
- [ ] Multi-language support beyond Hebrew
- [ ] Mobile app versions (iOS/Android)
- [ ] Advanced audio analysis (pitch, tempo)
- [ ] Community-shared reference recordings
- [ ] Offline mode with service workers

## 🤝 Contributing

This project is open source and welcomes contributions! Areas for improvement:

- Enhanced Hebrew text analysis
- Better speech recognition accuracy
- Additional visual feedback options
- Performance optimizations
- Mobile responsiveness
- Accessibility improvements

## 📝 License

This project is open source and available for use in Torah study and practice.

## 🙏 Acknowledgments

- **Faster-Whisper**: For efficient speech-to-text
- **FastAPI**: For the modern Python backend
- **React**: For the interactive frontend
- **Open Source Community**: For tools and libraries

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the documentation in `backend/README.md` and `frontend/README.md`

---

**Built with ❤️ for Torah study and practice**
