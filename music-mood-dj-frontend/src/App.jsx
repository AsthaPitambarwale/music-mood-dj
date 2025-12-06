import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploadMood, setUploadMood] = useState("");
  const [generateMood, setGenerateMood] = useState("");
  const [playlist, setPlaylist] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("mmj_theme") || "light");
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  /* ------------------ THEME ------------------ */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mmj_theme", theme);
  }, [theme]);

  /* ------------------ LOAD DATA ------------------ */
  useEffect(() => {
    fetchTracks();
    fetchTopTracks();
  }, []);

  useEffect(() => {
    if (queue.length > 0) {
      playAtIndex(0);
    }
  }, [queue]);

  const incrementPlayCount = async (id) => {
    try {
      await fetch(`${API_BASE}/tracks/play/${id}`, { method: "POST" });
      fetchTopTracks();
    } catch (e) {
      console.error("Failed to increment play count", e);
    }
  };

  async function fetchTracks() {
    try {
      const res = await fetch(`${API_BASE}/tracks`);
      const data = await res.json();
      setTracks(data || []);
    } catch {
      setTracks([]);
    }
  }

  async function fetchTopTracks() {
    try {
      const res = await fetch(`${API_BASE}/tracks/top`);
      const data = await res.json();
      setTopTracks(data || []);
    } catch {
      setTopTracks([]);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) return alert("Select a file");

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title || file.name);
      form.append("artist", artist || "Unknown");
      form.append("mood", uploadMood || "");

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      setTracks((prev) => [
        {
          _id: data._id,
          title: data.title,
          artist: data.artist,
          url: data.url || data.filePath,
          mood: data.mood,
        },
        ...prev,
      ]);

      setFile(null);
      setTitle("");
      setArtist("");
      setUploadMood("");
      alert("Uploaded successfully");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!generateMood.trim()) return alert("Enter mood");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/playlists/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: generateMood }),
      });

      const created = await res.json();

      const fullPlaylistReq = await fetch(`${API_BASE}/playlists/${created._id}`);
      const p = await fullPlaylistReq.json();
      setPlaylist(p);

      const q = (p.tracks || [])
        .map((t) => {
          const track = t.trackId;
          if (!track || !track.url) return null;

          return {
            _id: track._id,
            title: track.title,
            artist: track.artist,
            url: track.url.startsWith("http") ? track.url : `${API_BASE}${track.url}`,
          };
        })
        .filter(Boolean);

      setQueue(q);
      setGenerateMood("");
      fetchTopTracks();
    } finally {
      setLoading(false);
    }
  }

  function playAtIndex(i) {
    if (!audioRef.current || i < 0 || i >= queue.length) return;

    setCurrentIndex(i);
    const track = queue[i];
    audioRef.current.src = track.url;

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        incrementPlayCount(track._id);
      })
      .catch(() => {});
  }

  function togglePlay() {
    if (!audioRef.current) return;

    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});

    setIsPlaying((prev) => !prev);
  }

  async function playTrackUrl(track) {
    if (!track) return;

    const url = track.url.startsWith("http") ? track.url : `${API_BASE}${track.url}`;

    incrementPlayCount(track._id);

    setQueue([{ ...track, url }]);
    setCurrentIndex(0);

    setTimeout(() => {
      audioRef.current?.play().then(() => setIsPlaying(true));
    }, 50);
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Music Mood DJ</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Upload → Generate → Play → Top Tracks</p>
        </div>
        <button style={btnPrimarySmall} onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </header>

      {/* GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* LEFT */}
        <div>
          {/* UPLOAD */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Upload Track</h2>
            <form onSubmit={handleUpload}>
              <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} style={inputStyle} />
              <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
              <input placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} style={inputStyle} />
              <input placeholder="Mood (optional)" value={uploadMood} onChange={(e) => setUploadMood(e.target.value)} style={inputStyle} />
              <button style={btnPrimary}>{loading ? "Uploading..." : "Upload"}</button>
            </form>
          </section>

          {/* GENERATE */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Generate Mix</h2>
            <form onSubmit={handleGenerate}>
              <input placeholder="Enter mood..." value={generateMood} onChange={(e) => setGenerateMood(e.target.value)} style={inputStyle} />
              <button style={btnPrimary}>{loading ? "Generating..." : "Generate Mix"}</button>
            </form>

            {playlist && (
              <div style={playlistBox}>
                <b>Playlist: {playlist.mood}</b>
                <ol>
                  {playlist.tracks?.map((t, i) => (
                    <li key={i}>{t.trackId?.title} — {t.trackId?.artist}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div>
          {/* PLAYER */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Player</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button style={btnPrimarySmall} onClick={togglePlay}>{isPlaying ? "Pause" : "Play"}</button>
              <div>
                <div style={{ fontWeight: 700 }}>{queue[currentIndex]?.title || "—"}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{queue[currentIndex]?.artist || ""}</div>
              </div>
            </div>

            <audio
              ref={audioRef}
              onEnded={() => playAtIndex(currentIndex + 1)}
              controls
              style={{ width: "100%" }}
            />
          </section>

          {/* TRACKS */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Your Tracks</h2>
            {tracks.map((t) => (
              <div key={t._id} style={listItem}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.artist}</div>
                </div>
                <button style={btnPrimarySmall} onClick={() => playTrackUrl(t)}>Play</button>
              </div>
            ))}
          </section>

          {/* TOP TRACKS */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Top Tracks</h2>
            {topTracks.map((t) => (
              <div key={t._id} style={listItem}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.artist}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Plays: {t.playCount}
                  </div>
                </div>
                <button style={btnPrimarySmall} onClick={() => playTrackUrl(t)}>Play</button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { background: "var(--card-bg)", borderRadius: 16, padding: 20, boxShadow: "0 4px 14px rgba(0,0,0,0.08)", marginBottom: 24 };
const playlistBox = { marginTop: 14, background: "var(--card-bg-alpha)", padding: 12, borderRadius: 12, fontSize: 14 };
const sectionTitle = { fontSize: 18, fontWeight: 700, marginBottom: 16 };
const inputStyle = { width: "95%", padding: "12px", border: "1px solid var(--border-color)", borderRadius: 10, background: "var(--input-bg)", color: "var(--text-color)", marginBottom: 14 };
const btnPrimary = { width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: "var(--btn-bg)", color: "#fff", fontWeight: 700, cursor: "pointer" };
const btnPrimarySmall = { padding: "8px 14px", borderRadius: 10, border: "none", background: "var(--btn-bg)", color: "#fff", fontWeight: 600, cursor: "pointer" };
const listItem = { display: "flex", justifyContent: "space-between", padding: 12, marginBottom: 12, borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--card-bg-alpha)" };
