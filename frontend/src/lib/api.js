const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.details?.[0]?.message || data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateMe: (b) => request('/auth/me', { method: 'PATCH', body: b }),
  createMeeting: (title) => request('/meetings', { method: 'POST', body: { title } }),
  getMeeting: (code) => request(`/meetings/${code}`),
  history: () => request('/meetings/history'),
  token: (code) => request(`/meetings/${code}/token`, { method: 'POST' }),
  leave: (code) => request(`/meetings/${code}/leave`, { method: 'POST' }),
  remove: (code, identity) => request(`/meetings/${code}/remove`, { method: 'POST', body: { identity } }),
  end: (code) => request(`/meetings/${code}/end`, { method: 'POST' }),
  saveTranscript: (code, text) => request(`/meetings/${code}/transcript`, { method: 'POST', body: { text } }),
  getTranscript: (code) => request(`/meetings/${code}/transcript`),
  saveMessage: (code, text) => request(`/meetings/${code}/messages`, { method: 'POST', body: { text } }),
};

export const inviteLink = (code) => `${window.location.origin}/meeting/${code}`;
export const extractCode = (input) => (String(input).toLowerCase().match(/[a-z]{3}-[a-z]{4}-[a-z]{3}/) || [])[0] || null;
