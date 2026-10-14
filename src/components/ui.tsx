import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import type { LoanStatus } from '../api/types';

export function Notice({ error, children, tone = 'error' }: { error?: ApiError | null; children?: ReactNode; tone?: 'error' | 'ok' }) {
  if (!error && !children) return null;

  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {error ? <strong>{error.message}</strong> : children}
      {error && error.details.length > 0 && (
        <ul>
          {error.details.map((detail, index) => (
            <li key={index}>
              {detail.field}: {detail.issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const LABELS: Record<LoanStatus, string> = { open: 'Abierto', overdue: 'Vencido', closed: 'Cerrado' };

/** A rubber-stamp look for the computed loan status. */
export function Stamp({ status }: { status: LoanStatus }) {
  return <span className={`stamp ${status}`}>{LABELS[status]}</span>;
}

export function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="pager" aria-label="Paginación">
      <button type="button" className="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {pages} · {total} resultados
      </span>
      <button type="button" className="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Siguiente
      </button>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}
