"""
Leining App - Torah Reading Practice Application
Main Streamlit application for practicing Hebrew Torah reading with real-time feedback.
"""

import streamlit as st
import numpy as np
from pathlib import Path
import io
import tempfile
from typing import Optional

# Import helper functions
from logic import (
    normalize_hebrew,
    compare_hebrew_texts,
    has_reached_marker,
    remove_nikud
)

# Try to import optional dependencies
try:
    from streamlit_mic_recorder import mic_recorder
    MIC_RECORDER_AVAILABLE = True
except ImportError:
    MIC_RECORDER_AVAILABLE = False
    st.warning("streamlit-mic-recorder not available. Audio recording will be simulated.")

try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    st.warning("faster-whisper not available. Transcription will be simulated.")


# Page configuration
st.set_page_config(
    page_title="Leining App - Torah Reading Practice",
    page_icon="📖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load custom CSS
def load_css():
    """Load custom CSS for RTL support and animations."""
    css_file = Path(__file__).parent / "style.css"
    if css_file.exists():
        with open(css_file) as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
    else:
        # Inline basic RTL CSS if file not found
        st.markdown("""
        <style>
        .hebrew-text {
            direction: rtl;
            text-align: right;
            font-size: 2.5rem;
            line-height: 1.8;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 10px;
        }
        .flash-green {
            animation: flash-green 1s ease-in-out;
        }
        @keyframes flash-green {
            0%, 100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
            50% { box-shadow: 0 0 30px 10px rgba(40, 167, 69, 0.8); background-color: #d4edda; }
        }
        </style>
        """, unsafe_allow_html=True)

load_css()


# Initialize session state
if 'transcription' not in st.session_state:
    st.session_state.transcription = ""
if 'show_flash' not in st.session_state:
    st.session_state.show_flash = False
if 'reference_verse' not in st.session_state:
    # Example Hebrew verse (Genesis 1:1) with Nikud
    st.session_state.reference_verse = "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ"
if 'marker_word' not in st.session_state:
    # Placeholder marker word (e.g., "הַשָּׁמַיִם" for Etnahta position)
    st.session_state.marker_word = "השמים"
if 'whisper_model' not in st.session_state:
    st.session_state.whisper_model = None


def initialize_whisper_model(model_size: str = "tiny") -> Optional[WhisperModel]:
    """
    Initialize the Faster-Whisper model for Hebrew speech-to-text.
    
    Args:
        model_size: Size of the model ("tiny", "base", "small", etc.)
        
    Returns:
        WhisperModel instance or None if unavailable
    """
    if not WHISPER_AVAILABLE:
        return None
    
    try:
        with st.spinner(f"Loading Whisper {model_size} model..."):
            model = WhisperModel(model_size, device="cpu", compute_type="int8")
        st.success(f"Whisper {model_size} model loaded successfully!")
        return model
    except Exception as e:
        st.error(f"Error loading Whisper model: {e}")
        return None


def transcribe_audio(audio_bytes: bytes, model: Optional[WhisperModel]) -> str:
    """
    Transcribe audio to Hebrew text using Faster-Whisper.
    
    Args:
        audio_bytes: Audio data in bytes
        model: WhisperModel instance
        
    Returns:
        Transcribed Hebrew text
    """
    if not model or not WHISPER_AVAILABLE:
        # Placeholder/simulation mode
        return "בראשית ברא אלהים"
    
    try:
        # Save audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
        
        # Transcribe with Faster-Whisper
        segments, info = model.transcribe(
            temp_audio_path,
            language="he",  # Hebrew
            beam_size=5,
            word_timestamps=False
        )
        
        # Combine all segments
        transcription = " ".join([segment.text for segment in segments])
        
        # Clean up temp file
        Path(temp_audio_path).unlink()
        
        return transcription.strip()
        
    except Exception as e:
        st.error(f"Error during transcription: {e}")
        return ""


def check_for_marker(transcription: str, marker: str) -> bool:
    """
    Check if transcription has reached a marker word (Etnahta/Sof Pasuk).
    
    Args:
        transcription: Transcribed text
        marker: Marker word to check for
        
    Returns:
        True if marker is reached
    """
    return has_reached_marker(transcription, marker)


def display_flash_animation():
    """Display visual flash animation for reaching musical signs."""
    st.markdown(
        '<div class="visual-cue"><div class="visual-cue-icon pulse-icon">✨</div></div>',
        unsafe_allow_html=True
    )


# Main UI
def main():
    st.title("📖 Leining App - Torah Reading Practice")
    st.markdown("### Practice your Torah reading with real-time feedback")
    
    # Sidebar configuration
    with st.sidebar:
        st.header("⚙️ Settings")
        
        # Model selection
        if WHISPER_AVAILABLE:
            model_size = st.selectbox(
                "Whisper Model Size",
                ["tiny", "base", "small"],
                index=0,
                help="Smaller models are faster but less accurate"
            )
            
            if st.button("Load Model") or st.session_state.whisper_model is None:
                st.session_state.whisper_model = initialize_whisper_model(model_size)
        else:
            st.info("Faster-Whisper not available. Using simulation mode.")
            st.session_state.whisper_model = None
        
        st.divider()
        
        # Reference verse configuration
        st.subheader("Reference Verse")
        st.session_state.reference_verse = st.text_area(
            "Hebrew Verse (with Nikud)",
            value=st.session_state.reference_verse,
            height=100,
            help="Enter the Hebrew verse to practice"
        )
        
        st.session_state.marker_word = st.text_input(
            "Marker Word (for flash)",
            value=st.session_state.marker_word,
            help="Word that triggers the visual cue (e.g., Etnahta position)"
        )
        
        st.divider()
        
        # Display options
        st.subheader("Display Options")
        show_nikud = st.checkbox("Show Nikud", value=True)
        show_transcription = st.checkbox("Show Transcription", value=True)
        
    # Main content area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📜 Reference Verse")
        
        # Display verse with Nikud
        if show_nikud:
            flash_class = "flash-green" if st.session_state.show_flash else ""
            st.markdown(
                f'<div class="hebrew-text hebrew-text-with-nikud {flash_class}">{st.session_state.reference_verse}</div>',
                unsafe_allow_html=True
            )
        
        # Display verse without Nikud
        verse_without_nikud = remove_nikud(st.session_state.reference_verse)
        st.markdown(
            f'<div class="hebrew-text hebrew-text-without-nikud">{verse_without_nikud}</div>',
            unsafe_allow_html=True
        )
        
        # Show flash animation if triggered
        if st.session_state.show_flash:
            display_flash_animation()
            st.success("🎯 You reached the marker word!")
    
    with col2:
        st.subheader("🎤 Audio Recording")
        
        # Audio recording interface
        if MIC_RECORDER_AVAILABLE:
            audio_data = mic_recorder(
                start_prompt="🎙️ Start Recording",
                stop_prompt="⏹️ Stop Recording",
                just_once=False,
                use_container_width=True,
                key="mic_recorder"
            )
            
            if audio_data:
                st.audio(audio_data['bytes'])
                
                # Transcribe button
                if st.button("📝 Transcribe", use_container_width=True):
                    with st.spinner("Transcribing..."):
                        transcription = transcribe_audio(
                            audio_data['bytes'],
                            st.session_state.whisper_model
                        )
                        st.session_state.transcription = transcription
                        
                        # Check for marker word
                        if check_for_marker(transcription, st.session_state.marker_word):
                            st.session_state.show_flash = True
                        else:
                            st.session_state.show_flash = False
        else:
            st.info("Mic recorder not available.")
            
            # Simulation mode - text input for testing
            st.markdown("**Simulation Mode**")
            test_input = st.text_input(
                "Enter Hebrew text to test:",
                key="test_input",
                placeholder="בראשית ברא אלהים"
            )
            
            if st.button("Test Transcription", use_container_width=True):
                st.session_state.transcription = test_input
                
                # Check for marker word
                if check_for_marker(test_input, st.session_state.marker_word):
                    st.session_state.show_flash = True
                else:
                    st.session_state.show_flash = False
    
    # Transcription display
    if show_transcription and st.session_state.transcription:
        st.divider()
        st.subheader("📝 Transcription")
        
        st.markdown(
            f'<div class="transcription-box">{st.session_state.transcription}</div>',
            unsafe_allow_html=True
        )
        
        # Compare with reference
        exact_match, similarity = compare_hebrew_texts(
            st.session_state.reference_verse,
            st.session_state.transcription
        )
        
        if exact_match:
            st.success("✅ Perfect match!")
        else:
            st.info(f"📊 Similarity: {similarity:.1%}")
        
        # Show normalized versions for debugging
        with st.expander("🔍 View Normalized Comparison"):
            ref_normalized = normalize_hebrew(st.session_state.reference_verse)
            trans_normalized = normalize_hebrew(st.session_state.transcription)
            
            col_a, col_b = st.columns(2)
            with col_a:
                st.markdown("**Reference (normalized):**")
                st.code(ref_normalized)
            with col_b:
                st.markdown("**Transcription (normalized):**")
                st.code(trans_normalized)
    
    # Footer
    st.divider()
    st.markdown(
        '<div style="text-align: center; color: #666;">Built with Streamlit • Faster-Whisper • Hebrew Speech Recognition</div>',
        unsafe_allow_html=True
    )


if __name__ == "__main__":
    main()
