import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

// TRACKS
export const fetchTracks = () => API.get("/tracks");
export const uploadTrack = (formData) =>
  API.post("/tracks/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });

// PLAY COUNT
export const incrementPlay = (id) => API.post(`/tracks/play/${id}`);
export const fetchTopTracks = () => API.get("/tracks/top");

// MIX GENERATE
export const generateMix = (mood) =>
  API.post("/mix/generate", { mood });

// SAVE MIX
export const saveMix = (data) => API.post("/mix/save", data);
