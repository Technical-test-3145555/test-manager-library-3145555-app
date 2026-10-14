import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../../api/client';
import type { Member, Page } from '../../api/types';
import { Empty, Notice, Pager } from '../../components/ui';
import { useQuery } from '../../hooks/useQuery';

export function MembersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<Member | null>(null);

  const members = useQuery(() => api.get<Page<Member>>('/members', { q, page, size: 10 }), [q, page]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const member = await api.post<Member>('/members', { full_name: fullName, document_number: documentNumber });
      setMessage(`${member.full_name} ya es socio.`);
      setFullName('');
      setDocumentNumber('');
      members.reload();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    }
  }

  async function show(member: Member) {
    setDetail(await api.get<Member>(`/members/${member.id}`));
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Socios</p>
          <h1>Quienes piden prestado</h1>
        </div>
      </div>

      <form className="card form-card inline" onSubmit={create} aria-label="Nuevo socio">
        <label>
          Nombre completo
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={200} />
        </label>
        <label>
          Documento
          <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} required maxLength={30} />
        </label>
        <button type="submit">Registrar socio</button>
      </form>
      <Notice error={error} />
      {message && <Notice tone="ok">{message}</Notice>}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre o documento"
          aria-label="Buscar por nombre o documento"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Notice error={members.error} />
      {members.data && members.data.items.length === 0 && <Empty>No hay socios que coincidan.</Empty>}

      <ul className="list">
        {members.data?.items.map((member) => (
          <li key={member.id} className="card row">
            <div>
              <h3>{member.full_name}</h3>
              <p className="muted">Documento {member.document_number}</p>
            </div>
            <div className="row-actions">
              {detail?.id === member.id && <span className="chip">{detail.active_loans} sin devolver</span>}
              <button type="button" className="ghost" onClick={() => show(member)}>
                Ver préstamos activos
              </button>
            </div>
          </li>
        ))}
      </ul>

      {members.data && <Pager page={members.data.page} size={members.data.size} total={members.data.total} onPage={setPage} />}
    </section>
  );
}
