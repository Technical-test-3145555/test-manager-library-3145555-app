import { useState } from 'react';
import { ApiError, api } from '../../api/client';
import type { OverdueLine, Page } from '../../api/types';
import { Empty, Notice, Pager, formatDate } from '../../components/ui';
import { useQuery } from '../../hooks/useQuery';

export function OverduePage() {
  const [page, setPage] = useState(1);
  const [error, setError] = useState<ApiError | null>(null);
  const lines = useQuery(() => api.get<Page<OverdueLine>>('/loans/overdue', { page, size: 10 }), [page]);

  async function giveBack(line: OverdueLine) {
    setError(null);
    try {
      await api.post(`/loans/${line.loan_id}/items/${line.item_id}/return`);
      lines.reload();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Vencidos</p>
          <h1>Libros que ya deberían estar de vuelta</h1>
        </div>
      </div>

      <Notice error={lines.error ?? error} />
      {lines.data && lines.data.items.length === 0 && <Empty>No hay libros vencidos. Todo está al día.</Empty>}

      <ul className="list">
        {lines.data?.items.map((line) => (
          <li key={line.item_id} className="card row">
            <div>
              <h3>{line.book_title}</h3>
              <p className="muted">
                {line.member_name} · venció el {formatDate(line.due_at)}
              </p>
            </div>
            <div className="row-actions">
              <span className="late">{line.days_late} {line.days_late === 1 ? 'día' : 'días'} de retraso</span>
              <button type="button" onClick={() => giveBack(line)}>
                Devolver
              </button>
            </div>
          </li>
        ))}
      </ul>

      {lines.data && <Pager page={lines.data.page} size={lines.data.size} total={lines.data.total} onPage={setPage} />}
    </section>
  );
}
