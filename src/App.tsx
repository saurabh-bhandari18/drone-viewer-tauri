import { useState, useEffect, useRef } from "react";
import "./App.css";

// ===== CONFIGURATION =====
const DEFAULT_STREAM_URL = "http://192.168.42.129:8081/stream";

const FOXGLOVE_HOST = "192.168.144.50";
const FOXGLOVE_WIDE = `http://${FOXGLOVE_HOST}:8080/?ds=rosbridge-websocket&ds.url=ws%3A%2F%2F${FOXGLOVE_HOST}%3A9090`;
const FOXGLOVE_NARROW = `http://${FOXGLOVE_HOST}:8082/?ds=rosbridge-websocket&ds.url=ws%3A%2F%2F${FOXGLOVE_HOST}%3A9090`;

const NARROW_THRESHOLD = 46;
// ==========================

function StreamPanel({
  onConnect,
  onDisconnect,
}: {
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const [url, setUrl] = useState(DEFAULT_STREAM_URL);
  const [activeUrl, setActiveUrl] = useState("");
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    setActiveUrl(url);
    setConnected(true);
    onConnect();
  };

  const handleDisconnect = () => {
    setActiveUrl("");
    setConnected(false);
    onDisconnect();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
        <span className="w-2 h-2 rounded-full shrink-0 bg-green-500" />
        <span className="text-sm font-bold text-[#64c8ff] shrink-0">Video Mirror</span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 min-w-0 bg-[#0f0f1a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300 focus:border-[#64c8ff] outline-none"
          placeholder="http://<controller-ip>:8081/stream"
        />
        {!connected ? (
          <button
            onClick={handleConnect}
            className="px-3 py-1 bg-green-700 border border-green-600 rounded text-xs text-white hover:bg-green-600 transition shrink-0"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 bg-red-700 border border-red-600 rounded text-xs text-white hover:bg-red-600 transition shrink-0"
          >
            Disconnect
          </button>
        )}
      </div>
      <div className="flex-1 bg-black overflow-hidden flex items-center justify-center min-h-0">
        <img src={streamUrl} alt="Stream" className="stream-img" />
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
  onConnect,
}: {
  split: number;
  onSplitChange: (v: number) => void;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
  streaming: boolean;
  onConnect: () => void;
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
        <button
          onClick={onConnect}
          className="ml-auto px-2 py-0.5 bg-green-700 border border-green-600 rounded text-[10px] text-white hover:bg-green-600 transition"
        >
          Connect Stream
        </button>
      )}
    </div>
  );
}

function App() {
  const [split, setSplit] = useState(50);
  const [layout, setLayout] = useState<Layout>("cloud");
  const [streaming, setStreaming] = useState(false);

  const handleStreamConnect = () => {
    setStreaming(true);
    setLayout("side");
    setSplit(50);
  };

  const handleStreamDisconnect = () => {
    setStreaming(false);
    setLayout("cloud");
  };

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
        onConnect={handleStreamConnect}
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
          <StreamPanel onConnect={handleStreamConnect} onDisconnect={handleStreamDisconnect} />
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
