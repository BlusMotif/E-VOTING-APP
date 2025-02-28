
// Helper for API calls that works both locally and on Netlify
export const API_BASE = 
  import.meta.env.MODE === 'production' && !import.meta.env.VITE_API_URL
    ? '/.netlify/functions/api'
    : '/api';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  // For non-JSON responses
  if (!response.headers.get('content-type')?.includes('application/json')) {
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response;
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
}
