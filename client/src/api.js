const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('kanban_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),
  getUsers: () => apiRequest('/auth/users'),

  // Boards
  getBoards: () => apiRequest('/boards'),
  createBoard: (data) => apiRequest('/boards', { method: 'POST', body: JSON.stringify(data) }),
  getBoard: (id) => apiRequest(`/boards/${id}`),
  updateBoard: (id, data) => apiRequest(`/boards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBoard: (id) => apiRequest(`/boards/${id}`, { method: 'DELETE' }),
  addMember: (boardId, data) => apiRequest(`/boards/${boardId}/members`, { method: 'POST', body: JSON.stringify(data) }),

  // Cards
  createCard: (boardId, data) => apiRequest(`/boards/${boardId}/cards`, { method: 'POST', body: JSON.stringify(data) }),
  updateCard: (boardId, cardId, data) => apiRequest(`/boards/${boardId}/cards/${cardId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  moveCard: (boardId, cardId, data) => apiRequest(`/boards/${boardId}/cards/${cardId}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCard: (boardId, cardId) => apiRequest(`/boards/${boardId}/cards/${cardId}`, { method: 'DELETE' }),
};
