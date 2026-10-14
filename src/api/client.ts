/**
 * The single HTTP client: adds the token and turns the API's single error body into one ApiError.
 * The token lives in memory only (never in storage) and is set by the auth context.
 */

export interface ErrorDetail {
  field: string;
  issue: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
  }
}

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

let token: string | null = null;
let onUnauthorized: () => void = () => {};

export function setToken(value: string | null): void {
  token = value;
}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | undefined | null>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

async function toError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    return new ApiError(response.status, body.code ?? 'ERROR', body.message ?? 'Ocurrió un error inesperado.', body.details ?? []);
  } catch {
    return new ApiError(response.status, 'ERROR', 'No se pudo leer la respuesta del servidor.');
  }
}

export async function request<T>(method: string, path: string, options: { body?: unknown; query?: Query; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${withQuery(path, options.query)}`, {
      method,
      headers,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'No se pudo conectar con el servidor.');
  }

  if (response.status === 401 && token) onUnauthorized();
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  delete: (path: string) => request<void>('DELETE', path),
  upload: <T>(path: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<T>('PUT', path, { form });
  },
  /** Cover binary as an object URL; null when the book has none (404). */
  async coverUrl(bookId: string): Promise<string | null> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${BASE_URL}/books/${bookId}/cover`, { headers });
    return response.ok ? URL.createObjectURL(await response.blob()) : null;
  },
};
