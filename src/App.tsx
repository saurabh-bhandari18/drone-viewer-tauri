import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// ===== CONFIGURATION =====
const LOCAL_MODE = false;
const STREAM_HOST = LOCAL_MODE ? "localhost" : "192.168.42.129";
const STREAM_URL = `http://${STREAM_HOST}:8081/stream`;
const PING_URL = `http://${STREAM_HOST}:8081/ping`;

const FOXGLOVE_HOST = LOCAL_MODE ? "localhost" : "192.168.144.50";
const FOXGLOVE_WIDE = `http://${FOXGLOVE_HOST}:8080/?ds=rosbridge-websocket&ds.url=ws%3A%2F%2F${FOXGLOVE_HOST}%3A9090`;
const FOXGLOVE_NARROW = `http://${FOXGLOVE_HOST}:8082/?ds=rosbridge-websocket&ds.url=ws%3A%2F%2F${FOXGLOVE_HOST}%3A9090`;

const NARROW_THRESHOLD = 56;
const POLL_INTERVAL_MS = 2000;
// ==========================

function StreamPanel({ streaming }: { streaming: boolean }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${streaming ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
        <span className="text-sm font-bold text-[#64c8ff] shrink-0">Video Mirror</span>
        <span className={`text-[10px] px-1.5 rounded shrink-0 ${
          streaming ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
        }`}>
          {streaming ? "Live" : "Waiting..."}
        </span>
      </div>
      <div className="flex-1 bg-black overflow-hidden flex items-center justify-center min-h-0">
        {streaming ? (
          <img src={STREAM_URL} alt="Stream" className="stream-img" />
        ) : (
          <div className="text-center text-gray-600">
            <p className="text-lg mb-2">No Stream</p>
            <p className="text-xs">Press the mirror icon on the controller</p>
            <p className="text-xs mt-1">Stream will appear automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FoxglovePanel({ foxgloveSpace }: { foxgloveSpace: number }) {
  const [loaded, setLoaded] = useState(true);
  const isNarrow = foxgloveSpace < NARROW_THRESHOLD;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        <span className="text-sm font-bold text-[#64c8ff] shrink-0">Point Cloud</span>
        <span className={`text-[10px] px-1.5 rounded shrink-0 ${
          isNarrow ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"
        }`}>
          {isNarrow ? "Compact" : "Full"}
        </span>
        {loaded ? (
          <button
            onClick={() => setLoaded(false)}
            className="ml-auto px-3 py-1 bg-[#2e2e45] border border-[#2a2a3e] rounded text-xs text-gray-400 hover:bg-[#2a2a3e] transition shrink-0"
          >
            Clear
          </button>
        ) : (
          <button
            onClick={() => setLoaded(true)}
            className="ml-auto px-3 py-1 bg-[#2e2e45] border border-[#2a2a3e] rounded text-xs text-[#64c8ff] hover:bg-[#2a2a3e] transition shrink-0"
          >
            Load
          </button>
        )}
      </div>
      <div className="flex-1 bg-black overflow-hidden min-h-0 relative">
        {loaded ? (
          <>
            <iframe
              src={FOXGLOVE_WIDE}
              scrolling="no"
              className="absolute inset-0"
              style={{ display: !isNarrow ? "block" : "none" }}
            />
            <iframe
              src={FOXGLOVE_NARROW}
              scrolling="no"
              className="absolute inset-0"
              style={{ display: isNarrow ? "block" : "none" }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            Click "Load" to start point cloud viewer
          </div>
        )}
      </div>
    </div>
  );
}

type Layout = "side" | "stack" | "video" | "cloud";

function SettingsBar({
  split,
  onSplitChange,
  layout,
  onLayoutChange,
  streaming,
}: {
  split: number;
  onSplitChange: (v: number) => void;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
  streaming: boolean;
}) {
  const layouts: { key: Layout; label: string }[] = [
    { key: "side", label: "Side by Side" },
    { key: "stack", label: "Stacked" },
    { key: "video", label: "Video Only" },
    { key: "cloud", label: "Cloud Only" },
  ];

  const needsStream = (key: Layout) => key === "side" || key === "stack" || key === "video";

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400">Layout:</span>
        {layouts.map(({ key, label }) => {
          const disabled = !streaming && needsStream(key);
          return (
            <button
              key={key}
              onClick={() => !disabled && onLayoutChange(key)}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                disabled
                  ? "bg-[#1a1a2e] text-[#444] cursor-not-allowed"
                  : layout === key
                    ? "bg-[#64c8ff] text-black"
                    : "bg-[#2e2e45] text-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {streaming && (layout === "side" || layout === "stack") && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">Split:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => onSplitChange(Number(e.target.value))}
            className="w-24 h-1"
          />
          <span className="text-[10px] text-gray-500">{split}%</span>
        </div>
      )}

      {streaming ? (
        <span className="ml-auto text-[10px] text-green-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Stream Active
        </span>
      ) : (
        <span className="ml-auto text-[10px] text-gray-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          Waiting for stream...
        </span>
      )}
    </div>
  );
}

function App() {
  const [split, setSplit] = useState(50);
  const [layout, setLayout] = useState<Layout>("cloud");
  const [streaming, setStreaming] = useState(false);
  const wasStreaming = useRef(false);

  // Auto-detect stream via Rust ping
  useEffect(() => {
    const poll = async () => {
      try {
        const alive = await invoke<boolean>("ping_stream", { url: PING_URL });
        setStreaming(alive);
      } catch {
        setStreaming(false);
      }
    };

    poll(); // check immediately on mount
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Auto-switch layout when stream appears/disappears
  useEffect(() => {
    if (streaming && !wasStreaming.current) {
      setLayout("side");
      setSplit(50);
    } else if (!streaming && wasStreaming.current) {
      setLayout("cloud");
    }
    wasStreaming.current = streaming;
  }, [streaming]);

  const showVideo = streaming && layout !== "cloud";
  const showCloud = layout !== "video";
  const isStacked = layout === "stack";
  const foxgloveSpace = showVideo && showCloud ? (100 - split) : showCloud ? 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-[#0f0f1a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
        <h1 className="text-sm font-bold text-[#64c8ff]">Drone Viewer</h1>
        <span className="text-[10px] text-gray-500">Video Mirror + Point Cloud</span>
      </div>

      <SettingsBar
        split={split}
        onSplitChange={setSplit}
        layout={layout}
        onLayoutChange={setLayout}
        streaming={streaming}
      />

      <div className={`flex-1 flex ${isStacked ? "flex-col" : "flex-row"} overflow-hidden min-h-0`}>
        {/* Stream panel — always mounted, hidden with display:none */}
        <div
          style={{
            [isStacked ? "height" : "width"]: !showCloud ? "100%" : `${split}%`,
            display: showVideo ? "flex" : "none",
          }}
          className="flex flex-col border-r border-[#2a2a3e] overflow-hidden min-h-0 min-w-0"
        >
          <StreamPanel streaming={streaming} />
        </div>

        {/* Foxglove panel — always mounted, hidden with display:none */}
        <div
          style={{
            [isStacked ? "height" : "width"]: !showVideo ? "100%" : `${100 - split}%`,
            display: showCloud ? "flex" : "none",
          }}
          className="flex flex-col overflow-hidden min-h-0 min-w-0"
        >
          <FoxglovePanel foxgloveSpace={foxgloveSpace} />
        </div>
      </div>
    </div>
  );
}

export default App;
