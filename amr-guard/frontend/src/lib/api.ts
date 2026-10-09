const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "bypass-tunnel-reminder": "true",
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}
