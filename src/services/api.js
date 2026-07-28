import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const playerAPI = {
  getAll: (params) => api.get('/players', { params }),
  getById: (id) => api.get(`/players/${id}`),
  create: (data) => api.post('/players', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`),
  bulkUpload: (data) => api.post('/players/bulk', data),
  exportPlayers: () => api.get('/players/export'),
  getCountries: () => api.get('/players/countries'),
  getStats: () => api.get('/players/stats'),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  fetchImages: () => api.post('/players/fetch-images'),
  getImageStats: () => api.get('/players/admin/image-stats'),
  downloadMissing: () => api.post('/players/admin/download-missing'),
  retryFailed: () => api.post('/players/admin/retry-failed'),
  getPlayerImage: (id) => api.get(`/players/${id}/image`),
};

export const roomAPI = {
  create: (data) => api.post('/rooms', data),
  join: (code) => api.post('/rooms/join', { code }),
  getById: (id) => api.get(`/rooms/${id}`),
  getMyRooms: () => api.get('/rooms/my-rooms'),
  updateSettings: (id, data) => api.put(`/rooms/${id}/settings`, data),
  kickUser: (roomId, userId) => api.delete(`/rooms/${roomId}/kick/${userId}`),
  transferAdmin: (roomId, userId) => api.put(`/rooms/${roomId}/transfer/${userId}`),
  getLeaderboard: (id) => api.get(`/rooms/${id}/leaderboard`),
  getHistory: (id) => api.get(`/rooms/${id}/history`),
  getMyTeams: () => api.get('/rooms/my/teams'),
  getMyTeam: (id) => api.get(`/rooms/${id}/my-team`),
  togglePlayerStatus: (roomId, playerId) => api.put(`/rooms/${roomId}/toggle-status/${playerId}`),
};

export default api;
