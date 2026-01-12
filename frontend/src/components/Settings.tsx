/**
 * Settings Component - Configuration panel for the app
 */
import React from 'react';

interface SettingsProps {
  referenceText: string;
  markerWord: string;
  showNikud: boolean;
  modelSize: string;
  onReferenceTextChange: (text: string) => void;
  onMarkerWordChange: (word: string) => void;
  onShowNikudChange: (show: boolean) => void;
  onModelSizeChange: (size: string) => void;
  onLoadModel: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  referenceText,
  markerWord,
  showNikud,
  modelSize,
  onReferenceTextChange,
  onMarkerWordChange,
  onShowNikudChange,
  onModelSizeChange,
  onLoadModel,
}) => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
      <h2>⚙️ Settings</h2>

      <div style={{ marginTop: '20px' }}>
        <h3>Whisper Model</h3>
        <select
          value={modelSize}
          onChange={(e) => onModelSizeChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            marginBottom: '10px',
          }}
        >
          <option value="tiny">Tiny (fastest)</option>
          <option value="base">Base</option>
          <option value="small">Small</option>
        </select>
        <button
          onClick={onLoadModel}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Load Model
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Reference Verse</h3>
        <textarea
          value={referenceText}
          onChange={(e) => onReferenceTextChange(e.target.value)}
          placeholder="Enter Hebrew verse with Nikud"
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '1.2rem',
            direction: 'rtl',
            textAlign: 'right',
          }}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Marker Word</h3>
        <input
          type="text"
          value={markerWord}
          onChange={(e) => onMarkerWordChange(e.target.value)}
          placeholder="Word that triggers flash"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '1.1rem',
            direction: 'rtl',
            textAlign: 'right',
          }}
        />
        <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
          E.g., word at Etnahta position
        </small>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Display Options</h3>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showNikud}
            onChange={(e) => onShowNikudChange(e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          Show Nikud
        </label>
      </div>
    </div>
  );
};
