import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { setToken } from '../api/client';
import { AuthProvider } from '../auth/AuthContext';

function json(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

function mountAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const book = (n: number, available = 2) => ({
  id: `b${n}`, title: `Libro ${n}`, author: 'Autor', isbn: `978000000000${n}`, category: { id: 'c1', name: 'Novela' },
  total_copies: 3, available_copies: available, cover_key: null,
});

/** Routes the fake API by method and path. */
function fakeApi(role: 'admin' | 'librarian' = 'librarian') {
  const handlers: Record<string, () => Promise<Response>> = {
    'POST /auth/login': () => json(200, { access_token: 't', token_type: 'Bearer', expires_in: 28800, role }),
    'GET /categories': () => json(200, [{ id: 'c1', name: 'Novela' }]),
    'GET /books': () => json(200, { items: [book(1), book(2), book(3), book(4)], page: 1, size: 8, total: 4 }),
    'GET /members': () => json(200, { items: [{ id: 'm1', full_name: 'Ana Pérez', document_number: 'CC-1' }], page: 1, size: 20, total: 1 }),
  };
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname.replace('/api/v1', '');
    const key = `${init?.method ?? 'GET'} ${path}`;
    calls.push(key);
    return (handlers[key] ?? (() => json(404, { code: 'NOT_FOUND', message: 'El recurso no existe.', details: [] })))();
  }));
  return { calls, handlers };
}

afterEach(() => {
  setToken(null);
  vi.unstubAllGlobals();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('route protection', () => {
  it('sends a visitor without a session to the login', async () => {
    fakeApi();
    mountAt('/books');
    expect(await screen.findByRole('heading', { name: 'Abre la biblioteca' })).toBeInTheDocument();
  });

  it('hides the admin links from a librarian and bounces her from the report', async () => {
    fakeApi('librarian');
    mountAt('/login');
    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Libros en el estante' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Reporte' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Equipo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nuevo libro' })).not.toBeInTheDocument();
  });

  it('shows the admin links and the new book button to an admin', async () => {
    fakeApi('admin');
    mountAt('/login');
    await userEvent.type(screen.getByLabelText('Usuario'), 'admin');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('button', { name: 'Nuevo libro' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reporte' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Equipo' })).toBeInTheDocument();
  });
});

describe('login', () => {
  it('shows the message of the API when the credentials are wrong', async () => {
    const { handlers } = fakeApi();
    handlers['POST /auth/login'] = () => json(401, { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas.', details: [] });
    mountAt('/login');

    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mal');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.');
  });
});

describe('new loan', () => {
  it('lets her pick at most three books and registers the loan with exactly those', async () => {
    const { handlers, calls } = fakeApi();
    let sent: unknown;
    handlers['POST /loans'] = () => json(201, { id: 'l1', member_id: 'm1', loaned_at: '2026-10-14T10:00:00Z', status: 'open', items: [
      { id: 'i1', book_id: 'b1', book_title: 'Libro 1', isbn: '9780000000001', category_name: 'Novela', due_at: '2026-10-28T10:00:00Z', returned_at: null },
    ] });
    const original = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.endsWith('/loans')) sent = JSON.parse(String(init.body));
      return (original as typeof fetch)(url, init);
    }));

    mountAt('/login');
    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Prestar' }));

    await screen.findByRole('heading', { name: 'Un préstamo nuevo' });
    await userEvent.selectOptions(screen.getByLabelText('Socio'), 'm1');

    for (const n of [1, 2, 3, 4]) {
      await userEvent.click(await screen.findByRole('button', { name: new RegExp(`Libro ${n}`) }));
    }

    expect(screen.getByRole('button', { name: /Libro 1/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Libro 3/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Libro 4/ })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Registrar préstamo' }));

    await waitFor(() => expect(sent).toEqual({ member_id: 'm1', items: [{ book_id: 'b1' }, { book_id: 'b2' }, { book_id: 'b3' }] }));
    expect(await screen.findByText('Préstamo registrado')).toBeInTheDocument();
    expect(calls).toContain('GET /members');
  });
});

describe('theme', () => {
  it('switches between light and dark and remembers the choice', async () => {
    fakeApi();
    mountAt('/login');

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    await userEvent.click(screen.getByRole('button', { name: 'Activar tema oscuro' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('ml-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Activar tema claro' })).toBeInTheDocument();
  });
});
