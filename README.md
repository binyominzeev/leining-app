# Leining App - Torah Reading Practice

A Streamlit-based web application to help users practice Torah reading (leining) with real-time speech recognition and feedback.

## Features

- **RTL Hebrew Text Display**: Clean, large font display of Hebrew verses with and without Nikud
- **Audio Recording**: Live audio capture using streamlit-mic-recorder
- **Speech-to-Text**: Hebrew transcription using the faster-whisper library
- **Text Comparison**: Compare your reading with the reference text
- **Visual Feedback**: Flash animations when reaching important markers (Etnahta, Sof Pasuk)
- **Customizable**: Configure reference verses and marker words

## Installation

1. Clone the repository:
```bash
git clone https://github.com/binyominzeev/leining-app.git
cd leining-app
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

Note: The `faster-whisper` and `streamlit-mic-recorder` packages are optional. The app will run in simulation mode if they're not available.

## Usage

Run the Streamlit application:
```bash
streamlit run app.py
```

The application will open in your default web browser at `http://localhost:8501`.

## How to Use

1. **Configure Settings** (in sidebar):
   - Load the Whisper model (if available)
   - Set your reference Hebrew verse
   - Set the marker word that triggers visual feedback

2. **Practice Reading**:
   - View the Hebrew text displayed in RTL format
   - Click "Start Recording" to record your voice
   - Click "Stop Recording" when done
   - Click "Transcribe" to convert your speech to text

3. **Get Feedback**:
   - See your transcription displayed in Hebrew
   - View the similarity score compared to the reference
   - See a flash animation when you reach the marker word

## Project Structure

```
leining-app/
├── app.py              # Main Streamlit application
├── logic.py            # Hebrew text processing utilities
├── style.css           # Custom CSS for RTL and animations
├── requirements.txt    # Python dependencies
├── test_logic.py      # Unit tests for logic functions
└── README.md          # This file
```

## Development

### Running Tests

```bash
python test_logic.py
```

### Key Components

- **app.py**: Main application with UI, audio recording, and transcription
- **logic.py**: Helper functions for:
  - Removing Nikud (vowel marks)
  - Normalizing Hebrew text
  - Comparing Hebrew texts
  - Finding marker words

- **style.css**: Custom styling for:
  - Right-to-left (RTL) text display
  - Flash animations for visual cues
  - Hebrew font styling

## Dependencies

- `streamlit`: Web application framework
- `faster-whisper`: Efficient speech-to-text engine
- `streamlit-mic-recorder`: Audio recording component
- `numpy`: Numerical processing

## Notes

- The app uses UTF-8 encoding for proper Hebrew character handling
- Whisper models are downloaded on first use (tiny model ~70MB)
- The app can run in simulation mode without audio dependencies for testing

## License

This project is open source and available for use in Torah study and practice.
