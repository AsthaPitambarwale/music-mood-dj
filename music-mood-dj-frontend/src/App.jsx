import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [mood, setMood] = useState("");
  const [playlist, setPlaylist] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("mmj_theme") || "light");
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  /** Theme */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mmj_theme", theme);
  }, [theme]);

  /** Load Tracks */
  useEffect(() => {
    fetchTracks();
    fetchTopTracks();
  }, []);

  useEffect(() => {
    if (queue.length) playAtIndex(0);
  }, [queue]);

  async function fetchTracks() {
    try {
      const res = await fetch(`${API_BASE}/tracks`);
      const data = await res.json();
      setTracks(data || []);
    } catch (err) {
      console.error("Failed to fetch tracks", err);
      setTracks([]);
    }
  }

  async function fetchTopTracks() {
    try {
      const res = await fetch(`${API_BASE}/stats/top-tracks`);
      const data = await res.json();
      setTopTracks(data || []);
    } catch (err) {
      console.error("Failed to fetch top tracks", err);
      setTopTracks([]);
    }
  }

  /** Upload */
  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert("Select a file!");

    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title || file.name);
      form.append("artist", artist || "Unknown");

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      setTracks((prev) => [
        {
          _id: data._id || Math.random(),
          title: data.title || title,
          artist: data.artist || artist,
          filePath: data.url || data.filePath,
        },
        ...prev,
      ]);

      setFile(null);
      setTitle("");
      setArtist("");
      alert("Upload Successful!");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  /** Generate Playlist */
  async function handleGenerate(e) {
    e.preventDefault();
    if (!mood) return alert("Enter a mood");

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/playlists/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });

      const created = await res.json();

      const playlistRes = await fetch(`${API_BASE}/playlists/${created._id}`);
      const playlistData = await playlistRes.json();
      setPlaylist(playlistData);

      const q = (playlistData.tracks || [])
        .map((t) => {
          const track = t.trackId || t.track || {};
          if (!track.filePath && !track.url) return null;

          const url =
            track.url ||
            (track.filePath?.startsWith("http")
              ? track.filePath
              : `${API_BASE}${track.filePath}`);

          return {
            url,
            title: track.title || "Unknown",
            artist: track.artist || "Unknown",
          };
        })
        .filter(Boolean);

      setQueue(q);
      fetchTopTracks();
    } catch (err) {
      console.error(err);
      alert("Failed to generate playlist");
    } finally {
      setLoading(false);
    }
  }

  /** Playback */
  function playAtIndex(i) {
    if (!audioRef.current || i < 0 || i >= queue.length) return;
    setCurrentIndex(i);
    audioRef.current.src = queue[i].url;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    setIsPlaying((p) => !p);
  }

  function playTrackUrl(track) {
    if (!track) return;

    const url =
      track.url ||
      (track.filePath?.startsWith("http")
        ? track.filePath
        : `${API_BASE}${track.filePath}`);

    setQueue([{ url, title: track.title, artist: track.artist }]);
    setCurrentIndex(0);

    setTimeout(() => audioRef.current?.play().then(() => setIsPlaying(true)), 0);
  }

  /** Render */
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Music Mood DJ</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Upload → Generate Mix → Play → Top Tracks
          </p>
        </div>

        <button
          style={btnPrimarySmall}
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </header>

      {/* 2 Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* Upload Section */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Upload Track</h2>

            <form onSubmit={handleUpload} style={{ width: "100%" }}>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files[0] || null)}
                style={inputStyle}
              />

              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                style={inputStyle}
              />

              <button type="submit" disabled={loading} style={btnPrimary}>
                {loading ? "Uploading…" : "Upload"}
              </button>
            </form>
          </section>

          {/* Generate Mix */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Generate Mix</h2>

            <form onSubmit={handleGenerate} style={{ width: "100%" }}>
              <input
                placeholder="Mood prompt (love, happy, sad, party...)"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                style={inputStyle}
              />

              <button disabled={loading} style={btnPrimary}>
                {loading ? "Generating…" : "Generate Mix"}
              </button>
            </form>

            {playlist && (
              <div style={playlistBox}>
                <b>Playlist: {playlist.mood}</b>
                <ol>
                  {playlist.tracks?.map((t, i) => (
                    <li key={i}>
                      {t.trackId?.title || "Unknown"} —{" "}
                      {t.trackId?.artist || "Unknown"}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Player */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Player</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button style={btnPrimarySmall} onClick={togglePlay}>
                {isPlaying ? "Pause" : "Play"}
              </button>

              <div>
                <div style={{ fontWeight: 700 }}>
                  {queue[currentIndex]?.title || "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {queue[currentIndex]?.artist || ""}
                </div>
              </div>
            </div>

            <audio
              ref={audioRef}
              onEnded={() => playAtIndex(currentIndex + 1)}
              controls
              style={{ width: "100%" }}
            />
          </section>

          {/* Your Tracks */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Your Tracks</h2>

            {tracks.map((t) => (
              <div key={t._id} style={listItem}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {t.artist}
                  </div>
                </div>

                <button style={btnPrimarySmall} onClick={() => playTrackUrl(t)}>
                  Play
                </button>
              </div>
            ))}
          </section>

          {/* Top Tracks */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Top Tracks</h2>

            {topTracks.map((t) => (
              <div key={t._id} style={listItem}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {t.artist}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Selected in mixes: {t.playCount}
                  </div>
                </div>

                <button style={btnPrimarySmall} onClick={() => playTrackUrl(t)}>
                  Play
                </button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

/** ---------- CLEAN UI STYLES ---------- **/

const cardStyle = {
  background: "var(--card-bg)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  marginBottom: 24,
};

const playlistBox = {
  marginTop: 14,
  background: "var(--card-bg-alpha)",
  padding: 12,
  borderRadius: 12,
  fontSize: 14,
};

const sectionTitle = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 16,
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid var(--border-color)",
  borderRadius: 10,
  background: "var(--input-bg)",
  color: "var(--text-color)",
  fontSize: 14,
  marginBottom: 14,
};

const btnPrimary = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "var(--btn-bg)",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnPrimarySmall = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "none",
  background: "var(--btn-bg)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const listItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid var(--border-color)",
  background: "var(--card-bg-alpha)",
};
