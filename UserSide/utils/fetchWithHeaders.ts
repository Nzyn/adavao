/**
 * Wrapper around fetch that automatically adds ngrok bypass header
 * Use this instead of native fetch for all API calls
 */

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function fetchWithHeaders(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  // Merge default headers with custom headers
  const defaultHeaders: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  return fetch(url, mergedOptions);
}
