import React from 'react';
import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({ isRecording, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-primary flex-col gap-sm ${isRecording ? 'animate-recording' : ''}`}
      style={{ 
        width: '100px', 
        height: '100px', 
        borderRadius: '50%',
        transition: 'all 0.3s ease'
      }}
    >
      {isRecording ? <Square size={32} /> : <Mic size={32} />}
      <span style={{ fontSize: '0.9rem' }}>
        {isRecording ? 'Stop' : 'Tap to Speak'}
      </span>
    </button>
  );
};
