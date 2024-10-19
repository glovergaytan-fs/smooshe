import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver'; 

const bufferToWaveBlob = (buffer, audioContext) => {
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numberOfChannels * 2 + 44;
  const data = new DataView(new ArrayBuffer(length));
  const channels = [];

  let offset = 0;
  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      data.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };

  const writeHeader = () => {
    writeString('RIFF');
    data.setUint32(offset, length - 8, true);
    offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    data.setUint32(offset, 16, true);
    offset += 4;
    data.setUint16(offset, 1, true);
    offset += 2;
    data.setUint16(offset, numberOfChannels, true);
    offset += 2;
    data.setUint32(offset, audioContext.sampleRate, true);
    offset += 4;
    data.setUint32(offset, audioContext.sampleRate * 4, true);
    offset += 4;
    data.setUint16(offset, numberOfChannels * 2, true);
    offset += 2;
    data.setUint16(offset, 16, true);
    offset += 2;
    writeString('data');
    data.setUint32(offset, length - offset - 4, true);
    offset += 4;
  };

  const interleave = () => {
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < buffer.length; i++) {
      for (let j = 0; j < numberOfChannels; j++) {
        const sample = Math.max(-1, Math.min(1, channels[j][i]));
        data.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
  };

  writeHeader();
  interleave();

  return new Blob([data], { type: 'audio/wav' });
};

const useAudioStore = create((set, get) => ({
  tracks: [],
  mergedTrack: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  canUndo: false,
  canRedo: false,
  undoStack: [],
  redoStack: [],
  setAudioTracks: (tracks) => set({ tracks }),

  addTrack: (file) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const newTrack = {
        id: uuidv4(),
        file,
        volume: 1,
        muted: false,
        player: null,
        buffer, 
      };
      
      set((state) => ({
        tracks: [...state.tracks, newTrack],
        undoStack: [...state.undoStack, state.tracks],
        canUndo: true,
      }));
    };
  
    reader.readAsArrayBuffer(file);
  },

  updateTrackVolume: (id, volume) => {
    set((state) => ({
      tracks: state.tracks.map((track) => (track.id === id ? { ...track, volume } : track)),
    }));
  },

  removeTrack: (id) => {
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== id),
    }));
  },

  toggleTrackMute: (id) => {
    set((state) => ({
      tracks: state.tracks.map((track) => (track.id === id ? { ...track, muted: !track.muted } : track)),
    }));
  },

  reorderTracks: (fromIndex, toIndex) => {
    set((state) => {
      const tracks = [...state.tracks];
      const [movedTrack] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, movedTrack);
      return { tracks };
    });
  },

  resetTracks: () => {
    set({ tracks: [], canUndo: false });
  },

  // Removed 'const' keyword here
  mergeAndPreview: async () => {
    const { tracks } = get();
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const finalLength = tracks.reduce((totalLength, track) => totalLength + track.buffer.length, 0);

      if (finalLength === 0) {
        console.error("No audio data to merge.");
        return null; // Explicitly return null if no tracks
      }

      const finalBuffer = audioContext.createBuffer(2, finalLength, audioContext.sampleRate);
      let offset = 0;
      tracks.forEach((track) => {
        const currentBuffer = track.buffer;
        for (let channel = 0; channel < currentBuffer.numberOfChannels; channel++) {
          finalBuffer.getChannelData(channel).set(currentBuffer.getChannelData(channel), offset);
        }
        offset += currentBuffer.length;
      });

      // CREATE AND RETURN THE BLOB HERE
      const waveBlob = bufferToWaveBlob(finalBuffer, audioContext);
      return waveBlob; // Return the Blob

    } catch (error) {
      console.error("Error during merging and previewing tracks: ", error);
      return null; // Return null on error
    }
  },

  saveProject: () => {
    const { tracks } = get();
    const projectData = {
      tracks: tracks.map((track) => ({
        id: track.id,
        fileName: track.file.name,
        volume: track.volume,
        muted: track.muted,
      })),
    };

    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
    saveAs(blob, 'audio-project.json');
  },

  exportAudio: (format, quality) => {
    console.log(`Exporting audio as ${format} with quality ${quality} kbps`);
  },

}));

export { useAudioStore };