import React, { useState } from 'react';
import { useAudioStore } from '../store/audioStore';

const ExportOptions: React.FC = () => {
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState('192');
  const { exportAudio } = useAudioStore();

  const handleExport = () => {
    exportAudio(format, parseInt(quality));
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Export Options</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="format" className="block text-sm font-medium mb-1">
            Format
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="ogg">OGG</option>
          </select>
        </div>
        <div>
          <label htmlFor="quality" className="block text-sm font-medium mb-1">
            Quality (kbps)
          </label>
          <select
            id="quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="128">128</option>
            <option value="192">192</option>
            <option value="256">256</option>
            <option value="320">320</option>
          </select>
        </div>
      </div>
      <button
        onClick={handleExport}
        className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
      >
        Export
      </button>
    </div>
  );
};

export default ExportOptions;