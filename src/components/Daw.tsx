import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  Volume2,
  Download,
  Upload,
  Scissors,
  ChevronUp,
} from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import WaveSurfer from "wavesurfer.js";
import { useAudioStore } from "../store/audioStore"; // Adjust path as needed

const TOTAL_DURATION = 180; // 3 minutes in seconds

const timeSignatures = [
  "2/4",
  "3/4",
  "4/4",
  "6/8",
  "9/8",
  "12/8",
  "5/4",
  "7/4",
  "5/8",
  "7/8",
  "9/4",
  "11/8",
];

const initialClips = [
  {
    id: 1,
    name: "Drums.mp3",
    track: 0,
    start: 0,
    duration: 30,
    color: "bg-blue-500",
    waveform: null,
  },
  {
    id: 2,
    name: "Bass.wav",
    track: 1,
    start: 15,
    duration: 45,
    color: "bg-green-500",
    waveform: null,
  },
  {
    id: 3,
    name: "Guitar.ogg",
    track: 2,
    start: 60,
    duration: 60,
    color: "bg-yellow-500",
    waveform: null,
  },
];

export default function Daw() {
  const {
    tracks,
    setTracks,
    clips,
    setClips,

    snips,
    setSnips,
    mergeAudioClips,
    saveComposition,
  } = useAudioStore(); // Update your store
  const [compositionName, setCompositionName] = useState("my-composition.wav");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [masterVolume, setMasterVolume] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const playheadRef = useRef(null);
  const timelineRef = useRef(null);
  const waveformRefs = useRef({});

  useEffect(() => {
    let interval;
    if (playing) {
      interval = setInterval(() => {
        setCurrentTime((time) => (time + 0.1) % TOTAL_DURATION);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    clips.forEach((clip) => {
      if (!clip.waveform) {
        const wavesurfer = WaveSurfer.create({
          container: waveformRefs.current[clip.id],
          waveColor: "white",
          progressColor: "gray",
          cursorColor: "transparent",
          barWidth: 2,
          barRadius: 3,
          responsive: true,
          height: 50,
          normalize: true,
          partialRender: true,
        });
        wavesurfer.load(`/path/to/${clip.name}`); // Placeholder path, replace with actual path
        setClips((prevClips) =>
          prevClips.map((c) =>
            c.id === clip.id ? { ...c, waveform: wavesurfer } : c
          )
        );
      }
    });
  }, [clips]);

  const togglePlay = () => setPlaying(!playing);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  const getGridLines = () => {
    const [beatsPerBar, beatUnit] = timeSignature.split("/").map(Number);
    const secondsPerBeat = 60 / tempo;
    const secondsPerBar = secondsPerBeat * beatsPerBar;
    const totalBars = Math.ceil(TOTAL_DURATION / secondsPerBar);

    const gridLines = [];
    for (let bar = 0; bar <= totalBars; bar++) {
      const barPosition = (bar * secondsPerBar / TOTAL_DURATION) * 100;
      gridLines.push(
        <div
          key={`bar-${bar}`}
          className="absolute h-full w-0.5 bg-gold"
          style={{ left: `${barPosition * zoom}%` }}
        />
      );

      // Add beat lines within each bar
      for (let beat = 1; beat < beatsPerBar; beat++) {
        const beatPosition =
          ((bar * secondsPerBar + beat * secondsPerBeat) / TOTAL_DURATION) *
          100;
        gridLines.push(
          <div
            key={`beat-${bar}-${beat}`}
            className={`absolute h-full w-px ${
              beat === 1 ? "bg-red-500" : "bg-gray-600"
            }`}
            style={{ left: `${beatPosition * zoom}%` }}
          />
        );
      }
    }
    return gridLines;
  };

  const addTrack = () => {
    const newTrack = {
      id: tracks.length + 1,
      name: `Track ${tracks.length + 1}`,
      volume: 1,
      playing: false,
    };
    setTracks([...tracks, newTrack]);
  };

  const toggleTrackPlay = (trackId: number) => {
    setTracks((tracks) =>
      tracks.map((track) =>
        track.id === trackId ? { ...track, playing: !track.playing } : track
      )
    );
  };

  const setTrackVolume = (trackId: number, volume: number) => {
    setTracks((tracks) =>
      tracks.map((track) =>
        track.id === trackId ? { ...track, volume } : track
      )
    );
  };

  const addClip = () => {
    const newClip = {
      id: Math.max(...clips.map((c) => c.id), 0) + 1,
      name: `New Clip ${clips.length + 1}.mp3`,
      track: 0,
      start: 0,
      duration: 10,
      color: `bg-${[
        "blue",
        "green",
        "yellow",
        "purple",
        "pink",
      ][Math.floor(Math.random() * 5)]}-500`,
      waveform: null,
    };
    setClips([...clips, newClip]);
  };

  const handleClipClick = (clipId: number) => {
    const clipToSlice = clips.find((clip) => clip.id === clipId);
    if (clipToSlice) {
      const slicePoint = Math.min(
        clipToSlice.start + clipToSlice.duration,
        Math.max(clipToSlice.start, currentTime)
      );
      const newSnip = {
        id: Math.max(...snips.map((s) => s.id), 0) + 1,
        name: `${clipToSlice.name} (Snip)`,
        duration: slicePoint - clipToSlice.start,
        color: clipToSlice.color,
        waveform: null,
      };
      setSnips([...snips, newSnip]);
      setDrawerOpen(true);
    }
  };

  const handleSnipDragStart = (e: React.DragEvent, snipId: number) => {
    e.dataTransfer.setData("text/plain", `snip:${snipId}`);
  };

  const handleClipDragStart = (e: React.DragEvent, clipId: number) => {
    e.dataTransfer.setData("text/plain", `clip:${clipId}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    const [type, id] = data.split(":");
    const dropPosition =
      (e.clientX - timelineRef.current.getBoundingClientRect().left) /
      (timelineRef.current.offsetWidth / TOTAL_DURATION / zoom);

    if (type === "snip") {
      const snipToAdd = snips.find((s) => s.id === parseInt(id));
      if (snipToAdd) {
        const newClip = {
          ...snipToAdd,
          id: Math.max(...clips.map((c) => c.id), 0) + 1,
          track: trackIndex,
          start: dropPosition,
        };
        if (!checkCollision(newClip)) {
          setClips([...clips, newClip]);
          setSnips(snips.filter((s) => s.id !== parseInt(id)));
        }
      }
    } else if (type === "clip") {
      const updatedClips = clips.map((clip) =>
        clip.id === parseInt(id)
          ? { ...clip, track: trackIndex, start: dropPosition }
          : clip
      );
      if (
        !checkCollision(updatedClips.find((c) => c.id === parseInt(id)), updatedClips)
      ) {
        setClips(updatedClips);
      }
    }
  };

  const checkCollision = (newClip, clipsToCheck = clips) => {
    return clipsToCheck.some((clip) =>
      clip.id !== newClip.id &&
      clip.track === newClip.track &&
      (newClip.start >= clip.start && newClip.start < clip.start + clip.duration ||
        newClip.start + newClip.duration > clip.start && newClip.start + newClip.duration <= clip.start + clip.duration ||
        newClip.start <= clip.start && newClip.start + newClip.duration >= clip.start + clip.duration)
    );
  };

  const handleClipResize = (clipId: number, edge: "start" | "end", newPosition: number) => {
    setClips((prevClips) =>
      prevClips.map((clip) => {
        if (clip.id === clipId) {
          let newClip = { ...clip };
          if (edge === "start") {
            const newStart = Math.max(0, newPosition);
            newClip.duration += newClip.start - newStart;
            newClip.start = newStart;
          } else {
            newClip.duration = Math.max(0, newPosition - clip.start);
          }
          if (!checkCollision(newClip)) {
            return newClip;
          }
        }
        return clip;
      })
    );
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom((prevZoom) =>
        Math.max(1, Math.min(6, prevZoom + e.deltaY * -0.01))
      );
    }
  };

  const renderScrubBar = () => (
    <div className="relative h-6 bg-gray-700">
      {Array.from({ length: Math.ceil(TOTAL_DURATION / (10 * zoom)) + 1 }).map(
        (_, index) => (
          <React.Fragment key={index}>
            <span
              style={{ left: `${(index * 10 * zoom) / TOTAL_DURATION * 100}%` }}
              className="absolute top-0 h-full w-px bg-gray-500"
            />
            <span
              style={{ left: `${(index * 10 * zoom) / TOTAL_DURATION * 100}%` }}
              className="absolute top-full mt-1 text-xs text-gray-400"
            >
              {formatTime(index * 10 / zoom)}
            </span>
          </React.Fragment>
        )
      )}
      <div
        className="absolute top-0 w-0.5 h-full bg-red-500 pointer-events-none"
        style={{ left: `${(currentTime / TOTAL_DURATION) * 100 * zoom}%` }}
      />
    </div>
  );

  const downloadComposition = async () => {
    const mergedBlob = await mergeAudioClips(clips);
    if (mergedBlob) {
      saveAs(mergedBlob, compositionName);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white" onWheel={handleWheel}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <div className="p-4 bg-gray-800 h-full">
          <h2 className="text-xl font-bold mb-4">DAW Controls</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tempo (BPM)</label>
              <Slider
                value={[tempo]}
                onValueChange={([value]) => setTempo(value)}
                min={40}
                max={240}
                step={1}
                className="w-full"
              />
              <span className="text-sm">{tempo} BPM</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Signature</label>
              <Select value={timeSignature} onValueChange={setTimeSignature}>
                <SelectTrigger className="w-full bg-gray-700">
                  <SelectValue placeholder="Select time signature" />
                </SelectTrigger>
                <SelectContent>
                  {timeSignatures.map((ts) => (
                    <SelectItem key={ts} value={ts}>
                      {ts}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Audio Clips</h3>
              <Button onClick={addClip} className="w-full mb-2 bg-blue-600 hover:bg-blue-700">
                <Upload className="mr-2 h-4 w-4" /> Add Audio Clip
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar with master controls */}
        <div className="flex items-center justify-between p-4 bg-gray-800">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="icon"
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </Button>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />

              <Slider
                value={[masterVolume]}
                onValueChange={([value]) => setMasterVolume(value)}
                max={1}
                step={0.01}
                className="w-24"
              />
            </div>
            <span className="text-lg font-semibold">Master Control</span>
            <Button
              onClick={togglePlay}
              variant="outline"
              size="icon"
              className={`${
                playing ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              } rounded-full`}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm">{formatTime(currentTime)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Zoom:</span>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={6}
              step={0.1}
              className="w-24"
            />
            <Button onClick={downloadComposition} variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <input type="text" value={compositionName} onChange={e => setCompositionName(e.target.value)} />
          </div>
        </div>

        {/* Upper scrub bar */}
        {renderScrubBar()}

        {/* Tracks */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={timelineRef}>
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-16 bg-gray-800 rounded-lg overflow-hidden relative"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, track.id - 1)}
            >
              {/* Track controls */}
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-2 w-48">
                <span className="text-sm font-medium w-16 truncate">{track.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleTrackPlay(track.id)}
                >
                  {track.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={[track.volume]}
                  onValueChange={([value]) => setTrackVolume(track.id, value)}
                  max={1}
                  step={0.01}
                  className="w-20"
                />
              </div>

              {/* Start line */}
              <div className="absolute left-52 top-0 w-0.5 h-full bg-blue-500" />

              {/* Grid lines */}
              <div className="h-full ml-52 relative">
                {getGridLines()}
                {clips
                  .filter((clip) => clip.track === track.id - 1)
                  .map((clip) => (
                    <div
                      key={clip.id}
                      className={`absolute top-0 h-full ${clip.color} rounded-md cursor-move flex items-center justify-between px-2`}
                      style={{
                        left: `${(clip.start / TOTAL_DURATION) * 100 * zoom}%`,
                        width: `${(clip.duration / TOTAL_DURATION) * 100 * zoom}%`,
                      }}
                      onClick={() => handleClipClick(clip.id)}
                      draggable
                      onDragStart={(e) => handleClipDragStart(e, clip.id)}
                    >
                      <div
                        ref={(el) => (waveformRefs.current[clip.id] = el)}
                        className="absolute top-0 left-0 right-0 bottom-0"
                      />
                      <span className="text-xs truncate z-10">{clip.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClipClick(clip.id);
                        }}
                      >
                        <Scissors className="h-3 w-3" />
                      </Button>
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-50 cursor-ew-resize"
                        onMouseDown={(e) => {
                          const startX = e.clientX;
                          const startPosition = clip.start;
                          const handleMouseMove = (e: MouseEvent) => {
                            const dx = e.clientX - startX;
                            const newPosition =
                              startPosition +
                              (dx / timelineRef.current.offsetWidth) *
                                TOTAL_DURATION /
                                zoom;
                            handleClipResize(clip.id, "start", newPosition);
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener(
                              "mousemove",
                              handleMouseMove
                            );
                            document.removeEventListener(
                              "mouseup",
                              handleMouseUp
                            );
                          };
                          document.addEventListener("mousemove", handleMouseMove);
                          document.addEventListener("mouseup", handleMouseUp);
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-50 cursor-ew-resize"
                        onMouseDown={(e) => {
                          const startX = e.clientX;
                          const startDuration = clip.duration;
                          const handleMouseMove = (e: MouseEvent) => {
                            const dx = e.clientX - startX;
                            const newDuration =
                              startDuration +
                              (dx / timelineRef.current.offsetWidth) *
                                TOTAL_DURATION /
                                zoom;
                            handleClipResize(clip.id, "end", clip.start + newDuration);
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener(
                              "mousemove",
                              handleMouseMove
                            );
                            document.removeEventListener(
                              "mouseup",
                              handleMouseUp
                            );
                          };
                          document.addEventListener("mousemove", handleMouseMove);
                          document.addEventListener("mouseup", handleMouseUp);
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <Button onClick={addTrack} className="w-full mt-2">
            <Plus className="mr-2 h-4 w-4" /> Add Track
          </Button>
        </div>

        {/* Bottom scrub bar */}
        {renderScrubBar()}

        {/* Snip drawer */}
        <div
          className={`fixed bottom-0 left-0 right-0 bg-gray-800 transition-all duration-300 ease-in-out ${
            drawerOpen ? "h-48" : "h-8"
          }`}
        >
          <div
            className="h-8 bg-gray-700 cursor-pointer flex items-center justify-center"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <ChevronUp className={`transform transition-transform ${drawerOpen ? "rotate-180" : ""}`} />
          </div>
          <div className="p-4 flex flex-wrap gap-2 overflow-y-auto h-40">
            {snips.map((snip) => (
              <div
                key={snip.id}
                className={`${snip.color} rounded-md p-2 cursor-move`}
                draggable
                onDragStart={(e) => handleSnipDragStart(e, snip.id)}
              >
                <span className="text-xs">{snip.name}</span>
                <span className="text-xs block">{formatTime(snip.duration)}</span>
                <div
                  ref={(el) => (waveformRefs.current[snip.id] = el)}
                  className="w-full h-12 mt-1"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}