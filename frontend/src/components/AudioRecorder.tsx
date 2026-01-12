/**
 * AudioRecorder Component - Handles audio recording and playback
 */
import React from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const { isRecording, startRecording, stopRecording, audioBlob, error } = useAudioRecorder();

  const handleToggleRecording = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob && onRecordingComplete) {
        onRecordingComplete(blob);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
      <h3>🎤 Audio Recording</h3>
      
      <div style={{ marginTop: '15px' }}>
        <button
          onClick={handleToggleRecording}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1.1rem',
            backgroundColor: isRecording ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording'}
        </button>
      </div>

      {isRecording && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <span className="recording-indicator">● Recording...</span>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div style={{ marginTop: '15px' }}>
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {error && (
        <div style={{ marginTop: '10px', color: '#dc3545', fontSize: '0.9rem' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};
