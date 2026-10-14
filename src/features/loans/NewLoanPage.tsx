import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../../api/client';
import type { Book, Loan, Member, Page } from '../../api/types';
import { Empty, Notice, Stamp, formatDate } from '../../components/ui';
import { useQuery } from '../../hooks/useQuery';

const MAX_ITEMS = 3;

export function NewLoanPage() {
  const [memberQuery, setMemberQuery] = useState('');
  const [memberId, setMemberId] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [picked, setPicked] = useState<Book[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [created, setCreated] = useState<Loan | null>(null);
  const [busy, setBusy] = useState(false);

  const members = useQuery(() => api.get<Page<Member>>('/members', { q: memberQuery, size: 20 }), [memberQuery]);
  const books = useQuery(() => api.get<Page<Book>>('/books', { q: bookQuery, size: 8 }), [bookQuery]);

  function toggle(book: Book) {
    setPicked((current) => {
      if (current.some((b) => b.id === book.id)) return current.filter((b) => b.id !== book.id);
      return current.length >= MAX_ITEMS ? current : [...current, book];
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const loan = await api.post<Loan>('/loans', { member_id: memberId, items: picked.map((book) => ({ book_id: book.id })) });
      setCreated(loan);
      setPicked([]);
      books.reload();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Prestar</p>
          <h1>Un préstamo nuevo</h1>
          <p className="muted">Hasta {MAX_ITEMS} libros por préstamo, con 14 días de plazo.</p>
        </div>
      </div>

      <form className="loan-grid" onSubmit={submit} aria-label="Nuevo préstamo">
        <div className="card">
          <h2>1. ¿Quién lo pide?</h2>
          <input type="search" placeholder="Buscar socio" aria-label="Buscar socio" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} />
          <select aria-label="Socio" size={6} value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            {members.data?.items.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} · {member.document_number}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <h2>2. ¿Qué libros se lleva?</h2>
          <input type="search" placeholder="Buscar libro" aria-label="Buscar libro" value={bookQuery} onChange={(e) => setBookQuery(e.target.value)} />
          {books.data && books.data.items.length === 0 && <Empty>No hay libros con esa búsqueda.</Empty>}
          <ul className="pick">
            {books.data?.items.map((book) => {
              const on = picked.some((b) => b.id === book.id);
              return (
                <li key={book.id}>
                  <button type="button" className={`pick-item ${on ? 'on' : ''}`} aria-pressed={on} disabled={book.available_copies === 0 && !on} onClick={() => toggle(book)}>
                    <span>
                      <strong>{book.title}</strong>
                      <small>{book.author}</small>
                    </span>
                    <span className="chip">{book.available_copies} disp.</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card summary">
          <h2>3. Confirmar</h2>
          {picked.length === 0 ? <Empty>Elige de uno a tres libros.</Empty> : (
            <ul>
              {picked.map((book) => (
                <li key={book.id}>{book.title}</li>
              ))}
            </ul>
          )}
          <Notice error={error} />
          <button type="submit" disabled={busy || !memberId || picked.length === 0}>
            Registrar préstamo
          </button>
        </div>
      </form>

      {created && (
        <div className="card receipt" role="status">
          <h2>Préstamo registrado</h2>
          <Stamp status={created.status} />
          <ul>
            {created.items.map((item) => (
              <li key={item.id}>
                {item.book_title} · vence el {formatDate(item.due_at)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
