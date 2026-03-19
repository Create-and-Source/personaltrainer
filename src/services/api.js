import { getToken } from './auth';

const API_BASE = 'https://w9jf3j7fjc.execute-api.us-west-2.amazonaws.com/api';

// Use real API when authenticated, fall back to localStorage for demo
let useRealApi = false;

export function setUseRealApi(val) { useRealApi = val; }
export function isUsingRealApi() { return useRealApi; }

async function apiCall(path, method = 'GET', body = null) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['x-trainer-id'] = 'demo-trainer';
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

// Clients
export const api = {
  // Clients
  getClients: () => apiCall('/clients'),
  getClient: (id) => apiCall(`/clients/${id}`),
  createClient: (data) => apiCall('/clients', 'POST', data),
  updateClient: (id, data) => apiCall(`/clients/${id}`, 'PUT', data),
  deleteClient: (id) => apiCall(`/clients/${id}`, 'DELETE'),

  // Sessions
  getSessions: () => apiCall('/sessions'),
  createSession: (data) => apiCall('/sessions', 'POST', data),
  updateSession: (id, data) => apiCall(`/sessions/${id}`, 'PUT', data),
  deleteSession: (id) => apiCall(`/sessions/${id}`, 'DELETE'),

  // Programs
  getPrograms: () => apiCall('/programs'),
  createProgram: (data) => apiCall('/programs', 'POST', data),
  updateProgram: (id, data) => apiCall(`/programs/${id}`, 'PUT', data),
  deleteProgram: (id) => apiCall(`/programs/${id}`, 'DELETE'),

  // Progress
  getProgress: (clientId) => apiCall(`/progress?clientId=${clientId}`),
  saveProgress: (data) => apiCall('/progress', 'POST', data),

  // Nutrition
  getNutrition: (clientId, date) => apiCall(`/nutrition?clientId=${clientId}&date=${date}`),
  saveNutrition: (data) => apiCall('/nutrition', 'POST', data),

  // Habits
  getHabits: (clientId) => apiCall(`/habits?clientId=${clientId}`),
  saveHabit: (data) => apiCall('/habits', 'POST', data),

  // Messages
  getConversations: () => apiCall('/messages'),
  getMessages: (conversationId) => apiCall(`/messages/${conversationId}`),
  sendMessage: (data) => apiCall('/messages', 'POST', data),

  // Workouts
  getWorkouts: () => apiCall('/workouts'),
  createWorkout: (data) => apiCall('/workouts', 'POST', data),
  updateWorkout: (id, data) => apiCall(`/workouts/${id}`, 'PUT', data),
  deleteWorkout: (id) => apiCall(`/workouts/${id}`, 'DELETE'),

  // Memberships
  getMemberships: () => apiCall('/memberships'),
  createMembership: (data) => apiCall('/memberships', 'POST', data),
  updateMembership: (id, data) => apiCall(`/memberships/${id}`, 'PUT', data),

  // Settings
  getSettings: () => apiCall('/settings'),
  updateSettings: (data) => apiCall('/settings', 'PUT', data),

  // Presigned URLs
  getUploadUrl: (fileName, contentType, folder) => apiCall('/presign', 'POST', { fileName, contentType, folder }),
};
