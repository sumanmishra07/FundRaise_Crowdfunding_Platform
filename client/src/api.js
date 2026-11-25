const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API = `${BASE}/api`;
export const SOCKET_URL = BASE;

// Thin wrapper over the Fetch API. Throws Error(message) on non-2xx responses.
export async function api(path, { method = 'GET', body, token } = {}) {
  const t = token ?? localStorage.getItem('fr_token');
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    if (res.status === 401 && t && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new Event('fr:unauthorized'));
    }
    const err = new Error(data?.message || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}
