import { useState } from 'react';
import { ApiError, api } from '../../api/client';
import type { Loan, LoanItem, LoanStatus, Member, Page } from '../../api/types';
import { Empty, Notice, Pager, Stamp, formatDate } from '../../components/ui';
import { useQuery } from '../../hooks/useQuery';

function LoanCard({ loan, onChanged }: { loan: Loan; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const member = useQuery(() => (open ? api.get<Member>(`/members/${loan.member_id}`) : Promise.resolve(null)), [open, loan.member_id]);

  async function giveBack(item: LoanItem) {
    setError(null);
    try {
      await api.post(`/loans/${loan.id}/items/${item.id}/return`);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    }
  }

  return (
    <li className="card loan">
      <button type="button" className="loan-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          <strong>{formatDate(loan.loaned_at)}</strong>
          <small>
            {loan.items.length} {loan.items.length === 1 ? 'libro' : 'libros'}
          </small>
        </span>
        <Stamp status={loan.status} />
      </button>

      {open && (
        <div className="loan-detail">
          {member.data && (
            <p className="muted">
              {member.data.full_name} · documento {member.data.document_number}
            </p>
          )}
          <Notice error={error} />
          <ul>
            {loan.items.map((item) => (
              <li key={item.id} className="line">
                <span>
                  <strong>{item.book_title}</strong>
                  <small>
                    {item.category_name} · vence {formatDate(item.due_at)}
                  </small>
                </span>
                {item.returned_at ? (
                  <span className="chip">Devuelto {formatDate(item.returned_at)}</span>
                ) : (
                  <button type="button" onClick={() => giveBack(item)}>
                    Devolver
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export function LoansPage() {
  const [status, setStatus] = useState<LoanStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const loans = useQuery(() => api.get<Page<Loan>>('/loans', { status, from, to, page, size: 10 }), [status, from, to, page]);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Préstamos</p>
          <h1>Todo lo que ha salido</h1>
        </div>
      </div>

      <div className="toolbar">
        <select aria-label="Estado" value={status} onChange={(e) => { setStatus(e.target.value as LoanStatus | ''); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="open">Abiertos</option>
          <option value="overdue">Vencidos</option>
          <option value="closed">Cerrados</option>
        </select>
        <label className="inline-label">
          Desde
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </label>
        <label className="inline-label">
          Hasta
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </label>
      </div>

      <Notice error={loans.error} />
      {loans.data && loans.data.items.length === 0 && <Empty>No hay préstamos con esos filtros.</Empty>}

      <ul className="list">
        {loans.data?.items.map((loan) => (
          <LoanCard key={loan.id} loan={loan} onChanged={loans.reload} />
        ))}
      </ul>

      {loans.data && <Pager page={loans.data.page} size={loans.data.size} total={loans.data.total} onPage={setPage} />}
    </section>
  );
}
