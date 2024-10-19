import React, { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';

interface ScrubberProps {
  onScrub: (time: number) => void;
}

const Scrubber: React.FC<ScrubberProps> = ({ onScrub }) => {
  const { currentTime, duration } = useAudioStore();
  const scrubberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrubberRef.current) {
      scrubberRef.current.value = String(currentTime);
    }
  }, [currentTime]);

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    onScrub(newTime); // Call the onScrub prop to update time in the track
  };

  return (
    <div>
      
      <div className="flex justify-between">
        
      </div>
    </div>
  );
};

export default Scrubber;