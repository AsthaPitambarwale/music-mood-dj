import React, { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
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

  /** --- Fetch Tracks --- **/
  async function fetchTracks() {
    try {
      const res = await fetch(`${API_BASE}/tracks`);
      const data = await res.json();
      setTracks(data || []);
    } catch (err) {
      console.error('Failed to fetch tracks', err);
      setTracks([]);
    }
  }

  async function fetchTopTracks() {
    try {
      const res = await fetch(`${API_BASE}/stats/top-tracks`);
      const data = await res.json();
      setTopTracks(data || []);
    } catch (err) {
      console.error('Failed to fetch top tracks', err);
      setTopTracks([]);
    }
  }

  /** --- Upload Track --- **/
  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert('Select a file!');

    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title || file.name);
      form.append('artist', artist || 'Unknown');

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      setTracks(prev => [
        {
          _id: data._id || Math.random(),
          title: data.title || title,
          artist: data.artist || artist,
          filePath: data.url || data.filePath,
        },
        ...prev,
      ]);

      setFile(null);
      setTitle('');
      setArtist('');
      alert('Upload successful!');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  }

  /** --- Generate Playlist --- **/
  async function handleGenerate(e) {
    e.preventDefault();
    if (!mood) return alert('Enter a mood');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/playlists/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });
      const created = await res.json();

      const playlistRes = await fetch(`${API_BASE}/playlists/${created._id}`);
      const playlistData = await playlistRes.json();
      setPlaylist(playlistData);

      const q = (playlistData.tracks || [])
        .map(t => {
          const track = t.trackId || t.track || {};
          if (!track.filePath && !track.url) return null;
          const url = track.url || (track.filePath?.startsWith('http') ? track.filePath : `${API_BASE}${track.filePath}`);
          return { url, title: track.title || 'Unknown', artist: track.artist || 'Unknown' };
        })
        .filter(Boolean);

      setQueue(q);
      fetchTopTracks();
    } catch (err) {
      console.error(err);
      alert('Failed to generate playlist');
    } finally {
      setLoading(false);
    }
  }

  /** --- Playback Controls --- **/
  function playAtIndex(i) {
    if (!audioRef.current || i < 0 || i >= queue.length) return;
    setCurrentIndex(i);
    audioRef.current.src = queue[i].url;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    setIsPlaying(prev => !prev);
  }

  function playTrackUrl(track) {
    if (!track) return;
    const url = track.url || (track.filePath?.startsWith('http') ? track.filePath : `${API_BASE}${track.filePath}`);
    setQueue([{ url, title: track.title || 'Unknown', artist: track.artist || 'Unknown' }]);
    setCurrentIndex(0);
    setTimeout(() => audioRef.current?.play().then(() => setIsPlaying(true)), 0);
  }

  /** --- Render --- **/
  return (
    <div className="app" style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Music Mood DJ</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Upload → Generate → Play → Top Tracks</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="theme-switch">
            <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
            <span className="slider"></span>
          </label>
          <button style={btnPrimary} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <div className="grid-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left Column */}
        <div>
          {/* Upload Section */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Upload Track</h2>
            <form onSubmit={handleUpload} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0] || null)} style={inputStyle} />
              <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
              <input placeholder="Artist" value={artist} onChange={e => setArtist(e.target.value)} style={inputStyle} />
              <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Uploading...' : 'Upload'}</button>
            </form>
          </section>

          {/* Generate Playlist Section */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Generate Mix</h2>
            <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Mood prompt" value={mood} onChange={e => setMood(e.target.value)} style={inputStyle} />
              <button disabled={loading} style={btnPrimary}>{loading ? 'Generating...' : 'Generate'}</button>
            </form>

            {playlist && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'var(--card-bg-alpha)', backdropFilter: 'blur(6px)' }}>
                <p style={{ fontWeight: 600 }}>Playlist: {playlist.mood}</p>
                <ol>
                  {(playlist.tracks || []).map((t, i) => (
                    <li key={i}>{t.trackId?.title || t.track?.title || 'Unknown'} — {t.trackId?.artist || t.track?.artist || 'Unknown'}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div>
          {/* Player Section */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Player</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button style={btnPrimary} onClick={togglePlay}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
              <div>
                <div style={{ fontWeight: 600 }}>Now: {queue[currentIndex]?.title || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{queue[currentIndex]?.artist || ''}</div>
              </div>
            </div>
            <audio ref={audioRef} onEnded={() => playAtIndex(currentIndex + 1)} controls style={{ width: '100%', marginTop: 10 }} />
          </section>

          {/* Your Tracks */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Your Tracks</h2>
            {tracks.map(t => (
              <div key={t._id || t.title} style={listItem}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.artist}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnPrimary} onClick={() => playTrackUrl(t)}>Play</button>
                  <button style={btnGhost} onClick={() => navigator.clipboard.writeText(t.filePath?.startsWith('http') ? t.filePath : `${API_BASE}${t.filePath}`)}>Copy</button>
                </div>
              </div>
            ))}
          </section>

          {/* Top Tracks */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Top Tracks</h2>
            {topTracks.map(t => (
              <div key={t._id || t.title} style={listItem}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.artist}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selected in mixes: {t.playCount}</div>
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

// --- Styles ---
const cardStyle = { background: 'var(--card-bg)', borderRadius: 12, padding: 16, boxShadow: '0 6px 18px rgba(16,24,40,0.06)', marginBottom: 16 };
const sectionTitle = { fontSize: 15, fontWeight: 600, marginBottom: 8 };
const inputStyle = { padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, flex: 1, background: 'var(--input-bg)', color: 'var(--text-color)' };
const btnPrimary = { padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--btn-bg)', color: '#fff', cursor: 'pointer', transition: '0.2s' };
const btnGhost = { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer', transition: '0.2s' };
const listItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px dashed var(--border-color)', borderRadius: 6, marginBottom: 6 };
