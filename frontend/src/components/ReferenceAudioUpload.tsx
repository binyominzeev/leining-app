/**
 * ReferenceAudioUpload Component - Handles reference audio file uploads
 */
import React, { useState } from 'react';

interface ReferenceAudioUploadProps {
  onUploadComplete?: (verseId: string) => void;
}

export const ReferenceAudioUpload: React.FC<ReferenceAudioUploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [verseId, setVerseId] = useState('default');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('verse_id', verseId);

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: `Upload successful: ${result.filename}` });
      
      if (onUploadComplete) {
        onUploadComplete(verseId);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px', marginTop: '20px' }}>
      <h3>📤 Reference Audio Upload</h3>
      
      <div style={{ marginTop: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Verse ID:
        </label>
        <input
          type="text"
          value={verseId}
          onChange={(e) => setVerseId(e.target.value)}
          placeholder="e.g., genesis-1-1"
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div style={{ marginTop: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Audio File:
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ width: '100%' }}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        style={{
          width: '100%',
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: uploading || !file ? 'not-allowed' : 'pointer',
          opacity: uploading || !file ? 0.5 : 1,
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Reference Audio'}
      </button>

      {message && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};
