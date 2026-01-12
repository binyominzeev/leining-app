# Leining App - Usage Guide

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/binyominzeev/leining-app.git
cd leining-app

# Install dependencies
pip install -r requirements.txt
```

### 2. Running the Application

```bash
streamlit run app.py
```

The app will open in your default browser at `http://localhost:8501`.

## Features Overview

### RTL Hebrew Text Display
- View Hebrew verses in Right-to-Left format
- Toggle between text with and without Nikud (vowel marks)
- Large, liturgical-quality fonts optimized for reading

### Audio Recording (when streamlit-mic-recorder is installed)
- Click "Start Recording" to capture your voice
- Click "Stop Recording" when finished
- The audio will be displayed for review

### Speech-to-Text Transcription (when faster-whisper is installed)
- Click "Transcribe" to convert audio to Hebrew text
- Uses the Faster-Whisper model for efficient local processing
- Supports Hebrew language recognition

### Text Comparison
- Compares your transcription with the reference verse
- Ignores Nikud differences for flexible matching
- Shows similarity percentage

### Visual Feedback
- Flash animation appears when you reach marker words
- Indicates positions like Etnahta or Sof Pasuk
- Green glow effect for positive feedback

## Simulation Mode

When optional dependencies aren't installed, the app runs in simulation mode:

1. Enter Hebrew text manually in the test input field
2. Click "Test Transcription"
3. See the comparison results and similarity score

This is useful for:
- Testing the app without microphone
- Development and debugging
- Demonstrating functionality

## Configuration

### In the Sidebar (⚙️ Settings):

**Model Selection** (if faster-whisper is available):
- Choose between "tiny", "base", or "small" models
- Smaller models are faster but less accurate
- Click "Load Model" to initialize

**Reference Verse**:
- Enter any Hebrew verse you want to practice
- Include Nikud for accurate display
- Example: `בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ`

**Marker Word**:
- Set a word that triggers the flash animation
- Typically positioned at Etnahta or Sof Pasuk
- Example: `השמים`

**Display Options**:
- Toggle "Show Nikud" on/off
- Toggle "Show Transcription" to hide/show results

## How Hebrew Text Comparison Works

The app uses smart comparison logic:

1. **Nikud Removal**: Strips vowel marks from both texts
2. **Normalization**: Removes extra whitespace
3. **Word Matching**: Compares individual words
4. **Similarity Score**: Calculates percentage match

Example:
```
Reference: בְּרֵאשִׁית בָּרָא אֱלֹהִים
Transcription: בראשית ברא אלהים
Result: ✅ Perfect match (100% similarity)
```

## Running Tests

```bash
# Run unit tests
python test_logic.py

# Run demo script
python demo_usage.py
```

## Troubleshooting

### "streamlit-mic-recorder not available"
- This is expected if the package isn't installed
- Use simulation mode for testing
- Install with: `pip install streamlit-mic-recorder`

### "faster-whisper not available"
- This is expected if the package isn't installed
- The app will simulate transcription
- Install with: `pip install faster-whisper`

### Model Loading Issues
- First load downloads the model (may take time)
- Ensure you have internet connectivity
- Models are cached locally after first download

### Hebrew Text Not Displaying Correctly
- Ensure your browser supports RTL text
- Modern browsers (Chrome, Firefox, Safari) work well
- Check that Hebrew fonts are installed on your system

## Tips for Best Results

1. **Clear Audio**: Record in a quiet environment
2. **Speak Clearly**: Enunciate Hebrew words carefully
3. **Match the Text**: Try to read the exact reference verse
4. **Use Nikud**: Include vowel marks in reference for accuracy
5. **Start Simple**: Begin with shorter verses

## Advanced Usage

### Custom CSS Styling
Edit `style.css` to customize:
- Font sizes and families
- Colors and backgrounds
- Animation speeds and effects

### Adding New Features
The modular structure makes it easy to extend:
- `app.py`: Add new UI components
- `logic.py`: Add text processing functions
- `style.css`: Add visual effects

## Support

For issues or questions:
- Check the README.md for documentation
- Review the demo_usage.py for examples
- Run test_logic.py to verify functionality
