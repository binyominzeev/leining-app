# Development Guide - Leining App

This guide provides detailed information for developers working on the Leining App.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Style](#code-style)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Contributing](#contributing)

## Architecture Overview

The Leining App is built as a modern monorepo with a clear separation between frontend and backend:

### Backend (FastAPI)
- **Framework**: FastAPI (Python 3.8+)
- **Speech Recognition**: Faster-Whisper
- **Communication**: REST API + WebSocket
- **Database**: File-based (reference audio storage)

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Audio**: Web Audio API
- **Communication**: Fetch API + WebSocket

### Communication Flow

```
User Browser (React)
    ↓ HTTP/WebSocket
FastAPI Backend
    ↓
Faster-Whisper (Speech-to-Text)
    ↓
Hebrew Text Processing
    ↓
Comparison & Scoring
```

## Development Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn
- Git

### Initial Setup

1. **Clone the repository**
```bash
git clone https://github.com/binyominzeev/leining-app.git
cd leining-app
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

### Running in Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
# Server runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

## Project Structure

```
leining-app/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── logic.py             # Hebrew text processing
│   ├── requirements.txt     # Python dependencies
│   ├── reference_audio/     # Uploaded audio files
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── HebrewText.tsx
│   │   │   ├── ReferenceAudioUpload.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useAudioRecorder.ts
│   │   │   └── useWebSocket.ts
│   │   ├── App.tsx          # Main component
│   │   ├── App.css          # App styles
│   │   ├── index.css        # Global styles
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
├── app.py                   # Legacy Streamlit app
├── logic.py                 # Original logic
├── test_logic.py           # Tests
├── README.md
└── DEVELOPMENT.md          # This file
```

## Development Workflow

### Adding a New Feature

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Implement the feature**
   - Backend changes go in `backend/`
   - Frontend changes go in `frontend/src/`
   - Update tests as needed

3. **Test your changes**
```bash
# Backend tests
python test_logic.py

# Frontend build
cd frontend && npm run build
```

4. **Commit and push**
```bash
git add .
git commit -m "Add feature: description"
git push origin feature/your-feature-name
```

### Making Backend Changes

1. **Edit `backend/main.py`** for API endpoints
2. **Edit `backend/logic.py`** for Hebrew text processing
3. **Test endpoints** using the Swagger UI at `http://localhost:8000/docs`
4. **Update `backend/requirements.txt`** if adding dependencies

Example: Adding a new endpoint
```python
@app.post("/api/new-feature")
async def new_feature(request: RequestModel):
    # Your logic here
    return {"result": "success"}
```

### Making Frontend Changes

1. **Create new components** in `frontend/src/components/`
2. **Use TypeScript** for type safety
3. **Follow React best practices** (hooks, functional components)
4. **Update CSS** in respective `.css` files

Example: Creating a new component
```typescript
import React from 'react';

interface MyComponentProps {
  text: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ text }) => {
  return <div>{text}</div>;
};
```

## Code Style

### Backend (Python)

- **PEP 8** style guide
- **Type hints** for all functions
- **Docstrings** for public functions
- **async/await** for I/O operations

Example:
```python
async def process_text(text: str) -> dict:
    """
    Process Hebrew text and return results.
    
    Args:
        text: Input Hebrew text
        
    Returns:
        Dict with processing results
    """
    result = normalize_hebrew(text)
    return {"normalized": result}
```

### Frontend (TypeScript)

- **TypeScript strict mode** enabled
- **Functional components** with hooks
- **CSS modules** or styled-components preferred
- **ESLint** for code quality

Example:
```typescript
interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const Input: React.FC<Props> = ({ value, onChange }) => {
  return (
    <input 
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};
```

## Testing

### Backend Tests

Run Python tests:
```bash
python test_logic.py
```

Add new tests to `test_logic.py`:
```python
def test_new_feature():
    result = my_new_function("input")
    assert result == "expected", f"Expected 'expected', got '{result}'"
```

### Frontend Tests

Lint the frontend code:
```bash
cd frontend
npm run lint
```

Build to check for TypeScript errors:
```bash
npm run build
```

### Manual Testing

1. **Start both servers** (backend and frontend)
2. **Test the complete flow**:
   - Load Whisper model
   - Set reference text
   - Record audio
   - Verify transcription
   - Check marker detection
   - Upload reference audio

## API Documentation

The backend provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Use these to test endpoints during development.

## Deployment

### Backend Deployment

1. **Production dependencies**:
```bash
pip install gunicorn
```

2. **Run with Gunicorn**:
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment

1. **Build for production**:
```bash
cd frontend
npm run build
```

2. **Serve the `dist/` directory** using any static file server

### Environment Variables

Backend:
- `WHISPER_MODEL_SIZE` - Default model size (default: "tiny")
- `REFERENCE_AUDIO_DIR` - Audio storage directory

Frontend:
- Configure API URL in `vite.config.ts` for production

## Contributing

### Before Submitting a PR

1. **Test your changes** thoroughly
2. **Run linters** and fix any issues
3. **Update documentation** if needed
4. **Write clear commit messages**
5. **Ensure builds succeed**

### Commit Message Format

```
Type: Brief description

Detailed explanation of changes
- Point 1
- Point 2
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit PR with description
5. Address review comments
6. Merge when approved

## Common Issues

### Backend Issues

**Issue**: Whisper model fails to load
**Solution**: Check internet connection, try a smaller model

**Issue**: CORS errors
**Solution**: Verify `allow_origins` in `main.py`

### Frontend Issues

**Issue**: Audio recording not working
**Solution**: Check browser permissions, ensure HTTPS/localhost

**Issue**: API calls fail
**Solution**: Verify backend is running, check proxy settings

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Faster-Whisper](https://github.com/guillaumekln/faster-whisper)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## Support

For questions or issues:
- Open an issue on GitHub
- Check existing documentation
- Review the code comments

---

**Happy coding! 📖✨**
