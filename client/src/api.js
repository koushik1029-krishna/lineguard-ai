export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || null;
  }
}

// The browser only talks to the LineGuard API. API keys stay on the server.
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the LineGuard server. Start the API and refresh this page.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.message || 'The request failed.', response.status, data.errors || null);
  }
  return data;
}

export function getOptions(signal) {
  return request('/api/options', { signal });
}

export function getDashboard(signal) {
  return request('/api/dashboard', { signal });
}

export function listIncidents(params, signal) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return request(`/api/incidents${query ? `?${query}` : ''}`, { signal });
}

export function getIncident(id, signal) {
  return request(`/api/incidents/${id}`, { signal });
}

export function getSimilar(id, signal) {
  return request(`/api/incidents/${id}/similar`, { signal });
}

export function createIncident(body) {
  return request('/api/incidents', { method: 'POST', body: JSON.stringify(body) });
}

export function updateIncident(id, body) {
  return request(`/api/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function getAssistantStatus(signal) {
  return request('/api/assistant/status', { signal });
}

export function troubleshoot(incidentId, signal) {
  return request('/api/assistant/troubleshoot', {
    method: 'POST',
    body: JSON.stringify({ incident_id: incidentId }),
    signal,
  });
}
