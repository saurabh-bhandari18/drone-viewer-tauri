import { useState } from "react";
import "./App.css";

const DEFAULT_STREAM_URL = "http://192.168.42.129:8081/";
const DEFAULT_FOXGLOVE_URL =
  "http://192.168.144.50:8080/?ds=rosbridge-websocket&ds.url=ws%3A%2F%2F192.168.144.50%3A9090";

function StreamPanel() {
  const [url, setUrl] = useState(DEFAULT_STREAM_URL);
  const [activeUrl, setActiveUrl] = useState("");
  const [connected, setConnected] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-green-500" : "bg-gray-500"}`} />
        <span className="text-sm font-bold text-[#64c8ff] shrink-0">Video Mirror</span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 min-w-0 bg-[#0f0f1a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300 focus:border-[#64c8ff] outline-none"
          placeholder="http://<controller-ip>:8081/"
        />
        {!connected ? (
          <button
            onClick={() => { setActiveUrl(url); setConnected(true); }}
            className="px-3 py-1 bg-green-700 border border-green-600 rounded text-xs text-white hover:bg-green-600 transition shrink-0"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={() => { setActiveUrl(""); setConnected(false); }}
            className="px-3 py-1 bg-red-700 border border-red-600 rounded text-xs text-white hover:bg-red-600 transition shrink-0"
          >
            Disconnect
          </button>
        )}
      </div>
      <div className="flex-1 bg-black overflow-hidden flex items-center justify-center min-h-0">
        {activeUrl ? (
          <img src={activeUrl} alt="Stream" className="stream-img" />
        ) : (
          <div className="text-center text-gray-600">
            <p className="text-lg mb-2">No Stream</p>
            <p className="text-xs">Press "Start Mirror" on the controller</p>
            <p className="text-xs mt-1">Then click "Connect" above</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FoxglovePanel() {
  const [url, setUrl] = useState(DEFAULT_FOXGLOVE_URL);
  const [activeUrl, setActiveUrl] = useState(DEFAULT_FOXGLOVE_URL);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        <span className="text-sm font-bold text-[#64c8ff] shrink-0">Point Cloud (Foxglove)</span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 min-w-0 bg-[#0f0f1a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300 focus:border-[#64c8ff] outline-none"
        />
        <button
          onClick={() => setActiveUrl(url)}
          className="px-3 py-1 bg-[#2e2e45] border border-[#2a2a3e] rounded text-xs text-[#64c8ff] hover:bg-[#2a2a3e] transition shrink-0"
        >
          Load
        </button>
        <button
          onClick={() => setActiveUrl("")}
          className="px-3 py-1 bg-[#2e2e45] border border-[#2a2a3e] rounded text-xs text-gray-400 hover:bg-[#2a2a3e] transition shrink-0"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 bg-black overflow-hidden min-h-0">
        {activeUrl ? (
          <iframe src={activeUrl} scrolling="no" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            Enter Foxglove URL and click Load
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
}: {
  split: number;
  onSplitChange: (v: number) => void;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
}) {
  const layouts: { key: Layout; label: string }[] = [
    { key: "side", label: "Side by Side" },
    { key: "stack", label: "Stacked" },
    { key: "video", label: "Video Only" },
    { key: "cloud", label: "Cloud Only" },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400">Layout:</span>
        {layouts.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onLayoutChange(key)}
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              layout === key ? "bg-[#64c8ff] text-black" : "bg-[#2e2e45] text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(layout === "side" || layout === "stack") && (
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
    </div>
  );
}

function App() {
  const [split, setSplit] = useState(50);
  const [layout, setLayout] = useState<Layout>("side");

  const showVideo = layout !== "cloud";
  const showCloud = layout !== "video";
  const isStacked = layout === "stack";

  return (
    <div className="flex flex-col h-screen bg-[#0f0f1a] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a2e] border-b border-[#2a2a3e] shrink-0">
        <h1 className="text-sm font-bold text-[#64c8ff]">Drone Viewer</h1>
        <span className="text-[10px] text-gray-500">Video Mirror + Point Cloud</span>
      </div>

      {/* Settings bar */}
      <SettingsBar split={split} onSplitChange={setSplit} layout={layout} onLayoutChange={setLayout} />

      {/* Content */}
      <div className={`flex-1 flex ${isStacked ? "flex-col" : "flex-row"} overflow-hidden min-h-0`}>
        {showVideo && (
          <div
            style={{ [isStacked ? "height" : "width"]: !showCloud ? "100%" : `${split}%` }}
            className="flex flex-col border-r border-[#2a2a3e] overflow-hidden min-h-0 min-w-0"
          >
            <StreamPanel />
          </div>
        )}

        {showCloud && (
          <div
            style={{ [isStacked ? "height" : "width"]: !showVideo ? "100%" : `${100 - split}%` }}
            className="flex flex-col overflow-hidden min-h-0 min-w-0"
          >
            <FoxglovePanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
