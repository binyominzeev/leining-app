"""
FastAPI backend for Leining App - Torah Reading Practice Application
Provides REST API and WebSocket endpoints for real-time speech-to-text feedback.
"""

import os
import io
import json
import tempfile
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np

# Import Hebrew text processing logic
from logic import (
    normalize_hebrew,
    compare_hebrew_texts,
    has_reached_marker,
    remove_nikud
)

# Try to import Faster-Whisper
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    WhisperModel = None


# FastAPI app initialization
app = FastAPI(
    title="Leining App API",
    description="Real-time Torah reading practice with speech-to-text feedback",
    version="2.0.0"
)

# CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class ReferenceTextRequest(BaseModel):
    text: str
    marker_word: Optional[str] = None


class ComparisonRequest(BaseModel):
    reference: str
    transcribed: str
    ignore_nikud: bool = True


class ComparisonResponse(BaseModel):
    exact_match: bool
    similarity: float
    reference_normalized: str
    transcribed_normalized: str


class MarkerCheckRequest(BaseModel):
    transcribed: str
    marker_word: str
    ignore_nikud: bool = True


class TranscriptionResponse(BaseModel):
    transcription: str
    language: str
    processing_time: float


# Global constants
VALID_MODEL_SIZES = ["tiny", "base", "small", "medium", "large"]

# Global state for Whisper model
whisper_model: Optional[Any] = None
reference_audio_dir = Path("./reference_audio")
reference_audio_dir.mkdir(exist_ok=True)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global whisper_model
    if WHISPER_AVAILABLE and WhisperModel is not None:
        try:
            # Load a lightweight model by default
            whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
            print("✓ Whisper model loaded successfully")
        except Exception as e:
            print(f"✗ Error loading Whisper model: {e}")
            whisper_model = None
    else:
        print("✗ Faster-Whisper not available")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Leining App API",
        "version": "2.0.0",
        "status": "running",
        "whisper_available": WHISPER_AVAILABLE,
        "whisper_loaded": whisper_model is not None
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "whisper_available": WHISPER_AVAILABLE,
        "whisper_model_loaded": whisper_model is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/model/load")
async def load_model(model_size: str = "tiny"):
    """
    Load or reload the Whisper model.
    
    Args:
        model_size: Size of the model (tiny, base, small, medium, large)
    """
    global whisper_model
    
    if not WHISPER_AVAILABLE or WhisperModel is None:
        raise HTTPException(status_code=503, detail="Faster-Whisper not available")
    
    if model_size not in VALID_MODEL_SIZES:
        raise HTTPException(status_code=400, detail=f"Invalid model size. Must be one of: {VALID_MODEL_SIZES}")
    
    try:
        whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
        return {
            "status": "success",
            "message": f"Whisper {model_size} model loaded",
            "model_size": model_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")


@app.post("/api/audio/upload", response_model=dict)
async def upload_reference_audio(file: UploadFile = File(...), verse_id: str = "default"):
    """
    Upload reference audio file for a Torah verse.
    
    Args:
        file: Audio file (WAV, MP3, etc.)
        verse_id: Identifier for the verse
    """
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Save the file
        file_ext = Path(file.filename).suffix
        save_path = reference_audio_dir / f"{verse_id}{file_ext}"
        
        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)
        
        return {
            "status": "success",
            "message": "Reference audio uploaded",
            "verse_id": verse_id,
            "filename": file.filename,
            "size_bytes": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading audio: {str(e)}")


@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe uploaded audio file to Hebrew text.
    
    Args:
        file: Audio file to transcribe
    """
    if not whisper_model:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded. Please load model first at /api/model/load"
        )
    
    start_time = datetime.now()
    
    try:
        # Save uploaded file to temp location
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            # Transcribe with Whisper
            segments, info = whisper_model.transcribe(
                temp_path,
                language="he",  # Hebrew
                beam_size=5,
                word_timestamps=False
            )
            
            # Combine all segments
            transcription = " ".join([segment.text for segment in segments])
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return TranscriptionResponse(
                transcription=transcription.strip(),
                language=info.language,
                processing_time=processing_time
            )
        finally:
            # Clean up temp file
            Path(temp_path).unlink(missing_ok=True)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")


@app.post("/api/compare", response_model=ComparisonResponse)
async def compare_texts(request: ComparisonRequest):
    """
    Compare reference text with transcribed text.
    
    Args:
        request: Comparison request with reference and transcribed text
    """
    exact_match, similarity = compare_hebrew_texts(
        request.reference,
        request.transcribed,
        request.ignore_nikud
    )
    
    return ComparisonResponse(
        exact_match=exact_match,
        similarity=similarity,
        reference_normalized=normalize_hebrew(request.reference) if request.ignore_nikud else request.reference,
        transcribed_normalized=normalize_hebrew(request.transcribed) if request.ignore_nikud else request.transcribed
    )


@app.post("/api/marker/check")
async def check_marker(request: MarkerCheckRequest):
    """
    Check if transcribed text has reached a marker word.
    
    Args:
        request: Marker check request with transcribed text and marker word
    """
    reached = has_reached_marker(request.transcribed, request.marker_word, request.ignore_nikud)
    return {
        "marker_reached": reached,
        "marker_word": request.marker_word,
        "transcribed": request.transcribed
    }


@app.websocket("/ws/audio")
async def websocket_audio_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming and transcription.
    
    Client should send:
    - Binary audio chunks for transcription
    - JSON config messages for settings
    
    Server sends:
    - Transcription results
    - Similarity scores
    - Marker events
    """
    await websocket.accept()
    print("WebSocket connection established")
    
    # Session state
    reference_text = ""
    marker_word = ""
    audio_buffer = bytearray()
    
    try:
        while True:
            # Receive message (can be text or binary)
            message = await websocket.receive()
            
            if "text" in message:
                # Handle JSON config messages
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "config":
                        # Update reference text and marker
                        reference_text = data.get("reference_text", "")
                        marker_word = data.get("marker_word", "")
                        await websocket.send_json({
                            "type": "config_ack",
                            "message": "Configuration updated",
                            "reference_text": reference_text,
                            "marker_word": marker_word
                        })
                    
                    elif msg_type == "transcribe":
                        # Transcribe accumulated audio buffer
                        if not whisper_model:
                            await websocket.send_json({
                                "type": "error",
                                "message": "Whisper model not loaded"
                            })
                            continue
                        
                        if len(audio_buffer) == 0:
                            await websocket.send_json({
                                "type": "error",
                                "message": "No audio data to transcribe"
                            })
                            continue
                        
                        # Save buffer to temp file and transcribe
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                            temp_file.write(bytes(audio_buffer))
                            temp_path = temp_file.name
                        
                        try:
                            segments, info = whisper_model.transcribe(
                                temp_path,
                                language="he",
                                beam_size=5
                            )
                            
                            transcription = " ".join([segment.text for segment in segments]).strip()
                            
                            # Compare with reference if available
                            exact_match = False
                            similarity = 0.0
                            marker_reached = False
                            
                            if reference_text:
                                exact_match, similarity = compare_hebrew_texts(reference_text, transcription)
                            
                            if marker_word:
                                marker_reached = has_reached_marker(transcription, marker_word)
                            
                            # Send results
                            await websocket.send_json({
                                "type": "transcription",
                                "transcription": transcription,
                                "exact_match": exact_match,
                                "similarity": similarity,
                                "marker_reached": marker_reached
                            })
                            
                        finally:
                            Path(temp_path).unlink()
                            audio_buffer.clear()
                    
                    elif msg_type == "clear":
                        # Clear audio buffer
                        audio_buffer.clear()
                        await websocket.send_json({
                            "type": "buffer_cleared",
                            "message": "Audio buffer cleared"
                        })
                
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
            
            elif "bytes" in message:
                # Handle binary audio data
                audio_chunk = message["bytes"]
                audio_buffer.extend(audio_chunk)
                
                # Optional: Send acknowledgment
                await websocket.send_json({
                    "type": "audio_received",
                    "buffer_size": len(audio_buffer)
                })
    
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
