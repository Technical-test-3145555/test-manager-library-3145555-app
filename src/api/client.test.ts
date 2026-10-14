import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setToken, setUnauthorizedHandler } from './client';

function respond(status: number, body?: unknown) {
  return Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

afterEach(() => {
  setToken(null);
  setUnauthorizedHandler(() => {});
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('sends the bearer token and builds the query without empty values', async () => {
    const fetchMock = vi.fn(() => respond(200, { items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    setToken('abc');

    await api.get('/books', { q: 'cien', category_id: '', page: 2 });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/books\?q=cien&page=2$/);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('turns the single error body into an ApiError with code, message and details', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respond(409, { code: 'ISBN_TAKEN', message: 'Ya existe un libro activo con ese ISBN.', details: [{ field: 'isbn', issue: 'repetido' }] })));

    const error = await api.post('/books', {}).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('ISBN_TAKEN');
    expect(error.message).toBe('Ya existe un libro activo con ese ISBN.');
    expect(error.details).toEqual([{ field: 'isbn', issue: 'repetido' }]);
  });

  it('calls the unauthorized handler on a 401 while a session exists', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setToken('expired');
    vi.stubGlobal('fetch', vi.fn(() => respond(401, { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas.', details: [] })));

    await api.get('/books').catch(() => {});

    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not treat a failed login as an expired session', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal('fetch', vi.fn(() => respond(401, { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas.', details: [] })));

    await api.post('/auth/login', {}).catch(() => {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('reports a network failure in Spanish and returns undefined on 204', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('failed'))));
    const error = await api.get('/health').catch((e) => e);
    expect(error.code).toBe('NETWORK');
    expect(error.message).toBe('No se pudo conectar con el servidor.');

    vi.stubGlobal('fetch', vi.fn(() => respond(204)));
    await expect(api.delete('/books/1')).resolves.toBeUndefined();
  });
});
