import React from 'react';
import { Volume2 } from 'lucide-react';
import { useAudioStore } from '../store/audioStore';

const VolumeControl: React.FC = () => {
  const { masterVolume, setMasterVolume } = useAudioStore();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMasterVolume(parseFloat(e.target.value));
  };

  return (
    <div className="flex items-center space-x-2 mt-4">
      <Volume2 size={20} />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={masterVolume}
        onChange={handleVolumeChange}
        className="w-full"
      />
      <span className="text-sm">{Math.round(masterVolume * 100)}%</span>
    </div>
  );
};

export default VolumeControl;