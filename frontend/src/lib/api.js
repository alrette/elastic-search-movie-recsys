import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');
const api = axios.create({
    baseURL: `${API_BASE}/api`,
    timeout: 8000,
});

export default api;
