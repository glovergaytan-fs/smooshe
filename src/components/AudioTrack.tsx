import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Volume2, VolumeX, Trash2, Play, Pause, ArrowUp, ArrowDown } from 'lucide-react';
import { useAudioStore } from '../store/audioStore';

interface AudioTrackProps {
  track: {
    id: string;
    file: File;
    volume: number;
    muted: boolean;
  };
  index: number;
}

const AudioTrack: React.FC<AudioTrackProps> = ({ track, index }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const { updateTrackVolume, removeTrack, toggleTrackMute, reorderTracks, tracks } = useAudioStore();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) {
      wavesurfer.current?.pause();
    } else {
      wavesurfer.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    updateTrackVolume(track.id, newVolume);
  };

  const moveTrackUp = () => {
    if (index > 0) {
      reorderTracks(index, index - 1);
    }
  };

  const moveTrackDown = () => {
    if (index < tracks.length - 1) {
      reorderTracks(index, index + 1);
    }
  };

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        cursorColor: 'navy',
        barWidth: 3,
        barRadius: 9,
        responsive: true,
        height: 160,
      });

      wavesurfer.current.loadBlob(track.file);

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, [track.file]);

  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(track.muted ? 0 : track.volume);
    }
  }, [track.volume, track.muted]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8 w-[99%]">
      <div className="flex items-center mb-2">
        <span className="font-medium flex-grow">{track.file.name}</span>
        <div className="flex items-center space-x-2">
          <button onClick={toggleTrackMute.bind(null, track.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            {track.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={track.volume} onChange={handleVolumeChange} className="w-24" />
          <button onClick={removeTrack.bind(null, track.id)} className="p-1 rounded hover:bg-red-700 transition">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="relative" ref={waveformRef} />
      <button onClick={handlePlayPause} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-700 transition text-white rounded">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className="flex justify-between mt-5">
        {index > 0 && (
          <button onClick={moveTrackUp} className="p-1 rounded border border-transparent hover:border-gray-500 hover:bg-blue-700 transition">
            <ArrowUp size={30} />
          </button>
        )}
        {index < tracks.length - 1 && (
          <button onClick={moveTrackDown} className="p-1 rounded border border-transparent hover:border-gray-500 hover:bg-blue-700 transition">
            <ArrowDown size={30} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioTrack;