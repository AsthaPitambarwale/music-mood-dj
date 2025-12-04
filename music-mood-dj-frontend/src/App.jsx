import React, { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [uploadMood, setUploadMood] = useState('');   // ← NEW
  const [mood, setMood] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('mmj_theme') || 'light');
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mmj_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchTracks();
    fetchTopTracks();
  }, []);

  useEffect(() => {
    if (queue.length) playAtIndex(0);
  }, [queue]);

  /* ---- Fetch Tracks ---- */
  async function fetchTracks() {
    try {
      const res = await fetch(`${API_BASE}/tracks`);
      const data = await res.json();
      setTracks(data);
    } catch (err) {
      console.error('Failed to fetch tracks', err);
    }
  }

  async function fetchTopTracks() {
    try {
      const res = await fetch(`${API_BASE}/stats/top-tracks`);
      const data = await res.json();
      setTopTracks(data);
    } catch (err) {
      console.error('Failed to fetch top tracks', err);
    }
  }

  /* ---- Upload Track ---- */
  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert('Select a file!');

    setLoading(true);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title || file.name);
      form.append('artist', artist || 'Unknown');
      form.append('mood', uploadMood || "general");   // ← SEND MOOD

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      setTracks(prev => [
        {
          _id: data._id,
          title: data.title,
          artist: data.artist,
          url: data.url,
          mood: data.mood
        },
        ...prev,
      ]);

      setFile(null);
      setTitle('');
      setArtist('');
      setUploadMood('');
      alert('Upload successful!');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  }

  /* ---- Generate Playlist ---- */
  async function handleGenerate(e) {
    e.preventDefault();
    if (!mood) return alert("Enter a mood");

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/playlists/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood })
      });

      const created = await res.json();

      if (!created._id) {
        alert("Could not generate playlist");
        return;
      }

      const playlistRes = await fetch(`${API_BASE}/playlists/${created._id}`);
      const playlistData = await playlistRes.json();

      setPlaylist(playlistData);

      const q = (playlistData.tracks || [])
        .map(t => {
          const track = t.trackId;
          if (!track || !track.url) return null;
          return {
            url: track.url,
            title: track.title,
            artist: track.artist
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

  /* ---- Player Controls ---- */
  function playAtIndex(i) {
    if (!audioRef.current || i < 0 || i >= queue.length) return;
    setCurrentIndex(i);
    audioRef.current.src = queue[i].url;
    audioRef.current.play().then(() => setIsPlaying(true));
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().then(() => setIsPlaying(true));
    setIsPlaying(prev => !prev);
  }

  function playTrackUrl(track) {
    if (!track) return;
    setQueue([{ url: track.url, title: track.title, artist: track.artist }]);
    setCurrentIndex(0);
    setTimeout(() => audioRef.current?.play(), 100);
  }

  /* ---- Render ---- */
  return (
    <div className="app" style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h1>Music Mood DJ</h1>
      </header>

      <div className="grid-main" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* LEFT SIDE */}
        <div>
          {/* Upload Section */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Upload Track</h2>

            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0])} style={inputStyle} />
              <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
              <input placeholder="Artist" value={artist} onChange={e => setArtist(e.target.value)} style={inputStyle} />
              <input placeholder="Mood (happy, love, sad...)" value={uploadMood} onChange={e => setUploadMood(e.target.value)} style={inputStyle} />

              <button type="submit" style={btnPrimary}>{loading ? "Uploading..." : "Upload"}</button>
            </form>
          </section>

          {/* Generate Playlist */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Generate Mix</h2>

            <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Enter mood (love, workout, sad..)" value={mood} onChange={e => setMood(e.target.value)} style={inputStyle} />
              <button style={btnPrimary}>{loading ? "Generating..." : "Generate"}</button>
            </form>

            {playlist && (
              <div style={{ marginTop: 10 }}>
                <strong>Playlist: {playlist.mood}</strong>
                <ol>
                  {playlist.tracks.map((t, i) => (
                    <li key={i}>{t.trackId.title} — {t.trackId.artist}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT SIDE */}
        <div>
          {/* Player */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Player</h2>
            <button style={btnPrimary} onClick={togglePlay}>{isPlaying ? "Pause" : "Play"}</button>
            <audio ref={audioRef} onEnded={() => playAtIndex(currentIndex + 1)} controls style={{ width: "100%", marginTop: 10 }} />
          </section>

          {/* Tracks */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Your Tracks</h2>
            {tracks.map(t => (
              <div key={t._id} style={listItem}>
                <div>
                  <strong>{t.title}</strong>
                  <div>{t.artist}</div>
                </div>
                <button style={btnPrimary} onClick={() => playTrackUrl(t)}>Play</button>
              </div>
            ))}
          </section>
        </div>

      </div>
    </div>
  );
}

/* ---- Styles ---- */
const cardStyle = { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" };
const sectionTitle = { fontSize: 16, fontWeight: 600, marginBottom: 8 };
const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 8, width: "100%" };
const btnPrimary = { padding: "8px 14px", background: "#007bff", color: "#fff", borderRadius: 8, cursor: "pointer" };
const listItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderBottom: "1px dashed #ccc" };
