const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: unknown;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    data = null;
  }

  if (!res.ok) {
    let errorMsg = `Error HTTP ${res.status}`;
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      errorMsg = String((data as { detail: unknown }).detail);
    } else if (typeof data === 'object' && data !== null && 'message' in data) {
      errorMsg = String((data as { message: unknown }).message);
    } else if (typeof data === 'string' && data.length > 0) {
      errorMsg = data;
    }
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 2, delayMs = 500): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, init);
      if (init.method === 'GET' && (res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        attempt++;
        await sleep(delayMs * attempt);
        continue;
      }
      return res;
    } catch (err) {
      if (init.method === 'GET' && attempt < maxRetries) {
        attempt++;
        await sleep(delayMs * attempt);
        continue;
      }
      throw err;
    }
  }
}

export const apiClient = {
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.append(k, String(v));
        }
      });
    }

    const res = await fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return handleResponse<T>(res);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(res);
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return handleResponse<T>(res);
  },

  async delete<T = void>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    return handleResponse<T>(res);
  },
};
