import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '../api/types';
import { useAuth } from './AuthContext';

/** Routes are protected by role: no session goes to the login, a wrong role goes to the catalog. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { role } = useAuth();

  if (role === null) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/books" replace />;

  return <>{children}</>;
}
