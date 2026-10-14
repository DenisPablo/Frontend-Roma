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

const RETRY_STATUS_CODES = new Set([408, 502, 503, 504]);
const RETRY_DELAYS = [400, 1000, 2500, 4000];
const DEFAULT_TIMEOUT_MS = 15000;

function isNetworkOrTransientError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && err.name === 'TimeoutError') return true;
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') return true;
    const msg = err.message.toLowerCase();
    if (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network request failed') ||
      msg.includes('load failed') ||
      msg.includes('the operation was aborted')
    ) {
      return true;
    }
  }
  return false;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;

  while (true) {
    const timeoutSignal =
      typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(DEFAULT_TIMEOUT_MS) : undefined;
    const signal = init.signal || timeoutSignal;

    try {
      const res = await fetch(url, { ...init, signal });

      if (RETRY_STATUS_CODES.has(res.status) && attempt < maxRetries) {
        attempt++;
        const baseDelay = RETRY_DELAYS[attempt - 1] ?? 4000;
        const jitter = Math.floor(Math.random() * 200);
        await sleep(baseDelay + jitter);
        continue;
      }

      return res;
    } catch (err: unknown) {
      if (init.signal && init.signal.aborted) {
        throw err;
      }

      if (isNetworkOrTransientError(err) && attempt < maxRetries) {
        attempt++;
        const baseDelay = RETRY_DELAYS[attempt - 1] ?? 4000;
        const jitter = Math.floor(Math.random() * 200);
        await sleep(baseDelay + jitter);
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
    const res = await fetchWithRetry(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(res);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchWithRetry(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(res);
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetchWithRetry(`${BASE_URL}${path}`, {
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
    const res = await fetchWithRetry(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    return handleResponse<T>(res);
  },
};
