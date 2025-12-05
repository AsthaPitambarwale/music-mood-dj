# 🎵 Music Mood DJ

Music Mood DJ is a full-stack web application that allows users to **upload tracks**, **generate playlists based on mood**, **play tracks**, and view **top tracks**. It leverages a custom playlist generation engine powered by OpenAI's GPT API.

## 🌐 Live Demo

* **Backend:** [https://music-mood-dj.onrender.com](https://music-mood-dj.onrender.com)
* **Frontend:** [https://music-mood-dj.vercel.app/](https://music-mood-dj.vercel.app/)

---

## 🛠 Features

1. **Upload Tracks**

   * Upload audio files with metadata (title, artist, mood).
   * Files are stored on Cloudinary for scalable storage.

2. **Generate Mood-Based Playlists**

   * Enter a mood (happy, sad, love, etc.) to generate a playlist.
   * Uses GPT-based service to pick tracks that match the mood.

3. **Audio Player**

   * Play/pause tracks with a queue system.
   * Auto-plays next track in the playlist.

4. **Top Tracks**

   * Tracks with the highest play count are displayed.
   * Play count is automatically updated when a track is played.

5. **Responsive UI**

   * Dark/Light mode toggle.
   * Clean and intuitive layout.

---

## 📁 Tech Stack

### Backend

* Node.js, Express
* MongoDB + Mongoose
* Cloudinary (file storage)
* OpenAI API (playlist generation)
* Multer (file uploads)

### Frontend

* React
* Vite
* Vanilla CSS with variables for theme support
* Fetch API for backend requests

---

## 🚀 Installation

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file with the following:

```
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key
PORT=5000
```

Run the backend:

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

---

## 📂 Folder Structure

```
backend/
├─ controllers/
│  ├─ trackController.js
│  ├─ playlistController.js
│  └─ statsController.js
├─ models/
│  ├─ Track.js
│  └─ Playlist.js
├─ routes/
│  ├─ tracks.js
│  ├─ playlists.js
│  └─ statsRoutes.js
├─ services/
│  └─ llmService.js
└─ server.js

frontend/
├─ src/
│  ├─ App.jsx
│  ├─ api.js
│  └─ components/
│     └─ (optional UI components)
└─ package.json
```

---

## 🔗 API Endpoints

### Tracks

* `POST /api/tracks/upload` — Upload track
* `GET /api/tracks` — List all tracks

### Playlists

* `POST /api/playlists` — Generate playlist based on mood
* `GET /api/playlists/:id` — Get playlist details

### Stats

* `GET /api/stats/top` — Get top tracks
* `POST /api/stats/play/:id` — Increment track play count

---

## 🎨 UI Overview

* **Upload Section:** Upload tracks with title, artist, and mood.
* **Generate Mix:** Generate playlists based on mood.
* **Player Section:** Play, pause, and navigate tracks in the queue.
* **Your Tracks:** View all uploaded tracks.
* **Top Tracks:** See tracks selected in playlists the most.

---

## ⚡ Deployment

* Backend deployed on **Render**
* Frontend deployed on **Vercel**

---

## 📝 Notes

* Make sure **Cloudinary**, **MongoDB**, and **OpenAI API Key** are correctly configured.
* Playlist generation relies on GPT API — usage may incur costs.

