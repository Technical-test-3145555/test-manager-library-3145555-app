import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Notice } from '../../components/ui';

export function LoginPage() {
  const { role, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  if (role) return <Navigate to="/books" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/books');
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="welcome">
      <div className="welcome-art" aria-hidden="true">
        <span className="spine s1" />
        <span className="spine s2" />
        <span className="spine s3" />
        <span className="spine s4" />
        <span className="spine s5" />
      </div>

      <form className="card card-login" onSubmit={submit}>
        <p className="eyebrow">Bienvenida</p>
        <h1>Abre la biblioteca</h1>
        <p className="muted">Entra con tu usuario para llevar el catálogo, los socios y los préstamos.</p>

        <label>
          Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>

        <Notice error={error} />
        <button type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  );
}
