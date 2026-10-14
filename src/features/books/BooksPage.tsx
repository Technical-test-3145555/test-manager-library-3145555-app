import { useEffect, useState } from 'react';
import { ApiError, api } from '../../api/client';
import type { Book, Category, Page } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Empty, Notice, Pager } from '../../components/ui';
import { useQuery } from '../../hooks/useQuery';
import { BookForm } from './BookForm';

function Cover({ book }: { book: Book }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    if (book.cover_key) {
      api.coverUrl(book.id).then((value) => {
        revoked = value;
        setUrl(value);
      });
    } else {
      setUrl(null);
    }
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [book.id, book.cover_key]);

  return url ? <img className="cover" src={url} alt={`Portada de ${book.title}`} /> : <div className="cover blank" aria-hidden="true">{book.title.slice(0, 1)}</div>;
}

export function BooksPage() {
  const { role } = useAuth();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Book | 'new' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  const categories = useQuery(() => api.get<Category[]>('/categories'), []);
  const books = useQuery(() => api.get<Page<Book>>('/books', { q, category_id: categoryId, page, size: 12 }), [q, categoryId, page]);

  async function remove(book: Book) {
    if (!window.confirm(`¿Dar de baja «${book.title}»?`)) return;
    setDeleteError(null);
    try {
      await api.delete(`/books/${book.id}`);
      setMessage(`«${book.title}» salió del catálogo.`);
      books.reload();
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Libros en el estante</h1>
        </div>
        {role === 'admin' && (
          <button type="button" onClick={() => setEditing('new')}>
            Nuevo libro
          </button>
        )}
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por título o autor"
          aria-label="Buscar por título o autor"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filtrar por categoría"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas las categorías</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {message && <Notice tone="ok">{message}</Notice>}
      <Notice error={deleteError} />
      <Notice error={books.error} />

      {editing && (
        <BookForm
          book={editing === 'new' ? null : editing}
          categories={categories.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(text) => {
            setEditing(null);
            setMessage(text);
            books.reload();
          }}
        />
      )}

      {books.data && books.data.items.length === 0 && <Empty>No hay libros que coincidan con la búsqueda.</Empty>}

      <ul className="shelf">
        {books.data?.items.map((book) => (
          <li key={book.id} className="card book">
            <Cover book={book} />
            <div className="book-body">
              <span className="chip">{book.category.name}</span>
              <h3>{book.title}</h3>
              <p className="muted">{book.author}</p>
              <p className="copies">
                <strong className={book.available_copies === 0 ? 'none' : ''}>{book.available_copies}</strong> de {book.total_copies} disponibles
              </p>
              <p className="isbn">ISBN {book.isbn}</p>
              {role === 'admin' && (
                <div className="row-actions">
                  <button type="button" className="ghost" onClick={() => setEditing(book)}>
                    Editar
                  </button>
                  <button type="button" className="ghost danger" onClick={() => remove(book)}>
                    Dar de baja
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {books.data && <Pager page={books.data.page} size={books.data.size} total={books.data.total} onPage={setPage} />}
    </section>
  );
}
