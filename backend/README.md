# Leining App - Backend API

FastAPI backend for the Torah Reading Practice application providing real-time speech-to-text feedback and Hebrew text comparison.

## Features

- **REST API** for audio upload, transcription, and text comparison
- **WebSocket** endpoint for real-time audio streaming
- **Hebrew Speech Recognition** using Faster-Whisper
- **Text Comparison** with Nikud-aware Hebrew text processing
- **Marker Detection** for visual feedback triggers (Etnahta, Sof Pasuk)
- **CORS Support** for local frontend development

## Requirements

- Python 3.8+
- Dependencies listed in `requirements.txt`

## Installation

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

## Usage

### Development Server

Run the development server:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, view the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health & Status

- `GET /` - Health check
- `GET /api/health` - Detailed health status

### Model Management

- `POST /api/model/load?model_size=tiny` - Load/reload Whisper model
  - Model sizes: `tiny`, `base`, `small`, `medium`, `large`

### Audio Processing

- `POST /api/audio/upload` - Upload reference audio file
  - Form data: `file` (audio file), `verse_id` (identifier)
  
- `POST /api/transcribe` - Transcribe audio file to Hebrew text
  - Form data: `file` (audio file)

### Text Comparison

- `POST /api/compare` - Compare reference and transcribed Hebrew texts
  - JSON body:
    ```json
    {
      "reference": "בְּרֵאשִׁית בָּרָא אֱלֹהִים",
      "transcribed": "בראשית ברא אלהים",
      "ignore_nikud": true
    }
    ```

- `POST /api/marker/check` - Check if marker word is reached
  - Query params: `transcribed`, `marker_word`, `ignore_nikud`

### WebSocket

- `WS /ws/audio` - Real-time audio streaming and transcription
  
  **Client messages:**
  - Binary: Audio chunks (raw audio data)
  - Text (JSON):
    ```json
    {
      "type": "config",
      "reference_text": "בְּרֵאשִׁית בָּרָא אֱלֹהִים",
      "marker_word": "השמים"
    }
    ```
    ```json
    {
      "type": "transcribe"
    }
    ```
    ```json
    {
      "type": "clear"
    }
    ```
  
  **Server messages:**
  ```json
  {
    "type": "transcription",
    "transcription": "בראשית ברא אלהים",
    "exact_match": false,
    "similarity": 0.85,
    "marker_reached": false
  }
  ```

## Project Structure

```
backend/
├── main.py              # FastAPI application and endpoints
├── logic.py             # Hebrew text processing utilities
├── requirements.txt     # Python dependencies
├── reference_audio/     # Uploaded reference audio files (auto-created)
└── README.md           # This file
```

## Development

### Running Tests

```bash
# Run the logic tests from the root directory
python -m pytest test_logic.py
```

### Code Quality

The backend uses:
- Type hints for better code clarity
- Pydantic models for request/response validation
- Async/await for efficient I/O operations
- Proper error handling with HTTP status codes

## Configuration

Environment variables (optional):
- `WHISPER_MODEL_SIZE` - Default Whisper model size (default: "tiny")
- `REFERENCE_AUDIO_DIR` - Directory for reference audio files (default: "./reference_audio")

## Notes

- The Whisper model is downloaded on first use (~70MB for tiny model)
- Larger models provide better accuracy but require more memory and processing time
- WebSocket connections support both text (JSON) and binary (audio) messages
- CORS is configured for `localhost:3000` and `localhost:5173` (common React dev ports)

## License

This project is open source and available for use in Torah study and practice.
