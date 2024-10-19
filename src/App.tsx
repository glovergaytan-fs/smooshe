import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useHotkeys } from 'react-hotkeys-hook';
import { Merge } from 'lucide-react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AudioTrack from './components/AudioTrack';
import { useAudioStore } from './store/audioStore';
import ErrorBoundary from './components/ErrorBoundary';
import { saveAs } from 'file-saver';
import { bufferToWaveBlob } from './store/audioStore';
import WaveSurfer from 'wavesurfer.js';
import Daw from './components/Daw';


const App: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const {
        tracks,
        addTrack,
        reorderTracks,
        undo,
        redo,
        canUndo,
        canRedo,
        mergeAndPreview,
        setAudioTracks,
        mergeAudioClips,
    } = useAudioStore();

    const [mergedTrackBlob, setMergedTrackBlob] = useState<Blob | null>(null);
    const [mergedTrackName, setMergedTrackName] = useState<string>('merged-audio.wav');
    const waveformRef = useRef<HTMLDivElement>(null);
    const mergedWavesurfer = useRef<WaveSurfer | null>(null);


    useEffect(() => {
        document.body.classList.toggle('dark', darkMode);
    }, [darkMode]);

    useHotkeys('ctrl+z', undo, [undo]);
    useHotkeys('ctrl+y', redo, [redo]);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach((file) => {
                addTrack(file);
            });
        }
    }, [addTrack]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files) {
            Array.from(files).forEach((file) => {
                addTrack(file);
            });
        }
    }, [addTrack]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleMergeAndPreview = async () => {
  console.log("Starting merge and preview...");
  const mergedBlob = await mergeAndPreview();

  if (mergedBlob && waveformRef.current) {
    console.log("Merge successful. Blob created:", mergedBlob);
    setMergedTrackBlob(mergedBlob);

    // Crucial part: Initialize and load WaveSurfer with the merged Blob
    mergedWavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      cursorColor: 'navy',
      barWidth: 3,
      barRadius: 9,
      responsive: true,
      height: 160,
    });

    mergedWavesurfer.current.loadBlob(mergedBlob);
    console.log("WaveSurfer loaded with merged Blob");
  } else {
    console.error("Merge failed or waveformRef is null. No blob created or container not found.");
    if (!waveformRef.current) {
      console.error("waveformRef is null, please check your div in the render method.");
    }
  }
};

    const resetTracks = () => {
        setAudioTracks([]);
        setMergedTrackName('merged-audio.wav');
        if (mergedWavesurfer.current) {
            mergedWavesurfer.current.destroy();
            mergedWavesurfer.current = null;
        }
        setMergedTrackBlob(null);
    };

    const downloadMergedTrack = () => {
        if (mergedTrackBlob) {
            const filenameWithExtension = mergedTrackName.endsWith('.wav') || mergedTrackName.endsWith('.mp3')
                ? mergedTrackName
                : `${mergedTrackName}.wav`;
            saveAs(mergedTrackBlob, filenameWithExtension);
        }
    };

    return (
        <Router>
            <ErrorBoundary>
                <DndProvider backend={HTML5Backend}>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 font-sans">
                        <header className="bg-white dark:bg-gray-800 shadow-lg">
                            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                                <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">smooshe</h1>
                                <nav>
                                    <Link to="/music-maker" className="p-2 bg-blue-500 text-white rounded">Music Maker</Link>
                                </nav>
                            </div>
                        </header>

                        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                            <Routes>
                                <Route path="/" element={
                                    <>
                                        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-lg">
                                            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Merged Track</h2>
                                            <div className="relative" ref={waveformRef} />
                                            <input
                                                type="text"
                                                value={mergedTrackName}
                                                onChange={(e) => setMergedTrackName(e.target.value)}
                                                placeholder="Enter merged track name"
                                                className="border text-gray-700 rounded px-2 py-1 mb-4 w-full"
                                            />
                                            <button
                                                onClick={downloadMergedTrack}
                                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={mergedTrackBlob === null}
                                            >
                                                Download Merged Track
                                            </button>
                                        </div>

                                        {/* File Upload Section */}
                                        <div
                                            className="border-4 border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-32 flex items-center justify-center mb-6 cursor-pointer hover:border-gray-400 dark:hover:border-gray-600"
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="hidden"
                                                multiple
                                                accept="audio/*"
                                                onChange={handleFileUpload}
                                            />
                                            <span className="text-lg font-medium text-gray-500 dark:text-gray-400">Drag and drop audio files here or click to upload</span>
                                        </div>

                                        <div className="mt-8 space-y-10">
                                            {tracks.length > 0 ? (
                                                tracks.map((track, index) => (
                                                    <AudioTrack key={track.id} track={track} index={index} />
                                                ))
                                            ) : (
                                                <p className="text-center text-gray-600 dark:text-gray-400">No audio tracks added.</p>
                                            )}
                                        </div>

                                        <div className="flex justify-center space-x-4 mt-8">
                                            <button onClick={handleMergeAndPreview} className="bg-blue-600 w-1/3 text-white text-2xl px-2 py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center space-x-4">
                                                <Merge size={20} />
                                                <span>Merge</span>
                                            </button>
                                            <button onClick={resetTracks} className="bg-red-600 w-1/3 text-white text-2xl px-2 py-2 rounded-md hover:bg-red-700 transition">
                                                <span>Reset</span>
                                            </button>
                                        </div>
                                    </>
                                } />
                                <Route path="/music-maker" element={<Daw />} />
                            </Routes>
                        </main>
                    </div>
                </DndProvider>
            </ErrorBoundary>
        </Router>
    );
};

export default App;