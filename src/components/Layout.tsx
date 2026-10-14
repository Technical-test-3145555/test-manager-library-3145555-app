import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/useTheme';

const LINKS = [
  { to: '/books', label: 'Catálogo', roles: ['admin', 'librarian'] },
  { to: '/members', label: 'Socios', roles: ['admin', 'librarian'] },
  { to: '/loans/new', label: 'Prestar', roles: ['admin', 'librarian'] },
  { to: '/loans', label: 'Préstamos', roles: ['admin', 'librarian'] },
  { to: '/overdue', label: 'Vencidos', roles: ['admin', 'librarian'] },
  { to: '/report', label: 'Reporte', roles: ['admin'] },
  { to: '/users', label: 'Equipo', roles: ['admin'] },
];

export function Layout() {
  const { role, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <header className="dock">
        <span className="brand" aria-label="Manager Library">
          <span className="brand-mark" aria-hidden="true">ML</span>
          <span className="brand-name">Manager Library</span>
        </span>

        {role && (
          <nav aria-label="Principal">
            {LINKS.filter((link) => link.roles.includes(role)).map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/loans'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="dock-actions">
          <button type="button" className="ghost round" onClick={toggle} aria-label={theme === 'light' ? 'Activar tema oscuro' : 'Activar tema claro'} title="Cambiar tema">
            {theme === 'light' ? 'Noche' : 'Día'}
          </button>
          {role && (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Salir
            </button>
          )}
        </div>
      </header>

      <main className="stage">
        <Outlet />
      </main>

      <footer className="foot">Manager Library · catálogo, socios y préstamos</footer>
    </div>
  );
}
