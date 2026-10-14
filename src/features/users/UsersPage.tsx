import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../../api/client';
import { Notice } from '../../components/ui';

/** HU-02: the admin gives access to librarians. The admin role is never granted here. */
export function UsersPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const user = await api.post<{ username: string }>('/users', { username, password, role: 'librarian' });
      setMessage(`${user.username} ya puede entrar como bibliotecaria.`);
      setUsername('');
      setPassword('');
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Equipo</p>
          <h1>Dar acceso a una bibliotecaria</h1>
        </div>
      </div>

      <form className="card form-card" onSubmit={create} aria-label="Nuevo bibliotecario">
        <div className="grid-2">
          <label>
            Usuario
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </label>
        </div>
        <Notice error={error} />
        {message && <Notice tone="ok">{message}</Notice>}
        <button type="submit">Crear acceso</button>
      </form>
    </section>
  );
}
