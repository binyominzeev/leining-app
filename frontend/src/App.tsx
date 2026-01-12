/**
 * Main App Component
 * Leining App - Torah Reading Practice Application
 */
import { useState } from 'react';
import './App.css';
import { HebrewText } from './components/HebrewText';
import { AudioRecorder } from './components/AudioRecorder';
import { ReferenceAudioUpload } from './components/ReferenceAudioUpload';
import { Settings } from './components/Settings';
import { removeNikud } from './utils/hebrewUtils';

function App() {
  // State management
  const [referenceText, setReferenceText] = useState('בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ');
  const [markerWord, setMarkerWord] = useState('השמים');
  const [showNikud, setShowNikud] = useState(true);
  const [modelSize, setModelSize] = useState('tiny');
  const [transcription, setTranscription] = useState('');
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [exactMatch, setExactMatch] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  const handleLoadModel = async () => {
    setStatusMessage({ type: 'info', text: 'Loading model...' });
    try {
      const response = await fetch(`/api/model/load?model_size=${modelSize}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load model');
      }
      
      const result = await response.json();
      setStatusMessage({ type: 'success', text: `Model loaded: ${result.model_size}` });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to load model' });
      console.error('Error loading model:', error);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Transcribing...' });

    try {
      // Create FormData and send to backend
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      setTranscription(result.transcription);

      // Compare with reference text
      const compareResponse = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: referenceText,
          transcribed: result.transcription,
          ignore_nikud: true,
        }),
      });

      if (compareResponse.ok) {
        const compareResult = await compareResponse.json();
        setSimilarity(compareResult.similarity);
        setExactMatch(compareResult.exact_match);
      }

      // Check for marker
      const markerResponse = await fetch('/api/marker/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcribed: result.transcription,
          marker_word: markerWord,
          ignore_nikud: true,
        }),
      });

      if (markerResponse.ok) {
        const markerResult = await markerResponse.json();
        if (markerResult.marker_reached) {
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 1000);
        }
      }

      setStatusMessage({ type: 'success', text: 'Transcription complete!' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Transcription failed' });
      console.error('Error transcribing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📖 Leining App - Torah Reading Practice</h1>
        <p>Practice your Torah reading with real-time feedback</p>
      </header>

      <div className="app-content">
        <div className="main-panel">
          <section className="reference-section">
            <h2>📜 Reference Verse</h2>
            {showNikud && (
              <HebrewText 
                text={referenceText} 
                withNikud={true}
                showFlash={showFlash}
              />
            )}
            <HebrewText 
              text={removeNikud(referenceText)} 
              withNikud={false}
            />
            {showFlash && (
              <div className="marker-alert">
                <span className="pulse-icon">✨</span>
                <p>You reached the marker word!</p>
              </div>
            )}
          </section>

          <section className="transcription-section">
            <h2>📝 Transcription</h2>
            {transcription ? (
              <>
                <div className="transcription-box">
                  <HebrewText text={transcription} />
                </div>
                {similarity !== null && (
                  <div className="similarity-score">
                    {exactMatch ? (
                      <div className="score-perfect">✅ Perfect match!</div>
                    ) : (
                      <div className="score-partial">
                        📊 Similarity: {(similarity * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="transcription-placeholder">
                Record your voice to see transcription here
              </div>
            )}
          </section>

          <section className="recording-section">
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            {isProcessing && (
              <div className="processing-indicator">
                Processing audio...
              </div>
            )}
          </section>

          <section className="upload-section">
            <ReferenceAudioUpload />
          </section>
        </div>

        <aside className="sidebar">
          <Settings
            referenceText={referenceText}
            markerWord={markerWord}
            showNikud={showNikud}
            modelSize={modelSize}
            onReferenceTextChange={setReferenceText}
            onMarkerWordChange={setMarkerWord}
            onShowNikudChange={setShowNikud}
            onModelSizeChange={setModelSize}
            onLoadModel={handleLoadModel}
          />
        </aside>
      </div>

      {statusMessage && (
        <div className={`status-message status-${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <footer className="app-footer">
        <p>Built with React • FastAPI • Faster-Whisper • Hebrew Speech Recognition</p>
      </footer>
    </div>
  );
}

export default App;
