import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../../api/client';
import type { Book, Category } from '../../api/types';
import { Notice } from '../../components/ui';

interface Props {
  book: Book | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Create (all fields) or edit (the ISBN does not change, DT-09). Cover upload only for existing books. */
export function BookForm({ book, categories, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(book?.title ?? '');
  const [author, setAuthor] = useState(book?.author ?? '');
  const [isbn, setIsbn] = useState(book?.isbn ?? '');
  const [categoryId, setCategoryId] = useState(book?.category.id ?? categories[0]?.id ?? '');
  const [total, setTotal] = useState(String(book?.total_copies ?? 1));
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { title, author, category_id: categoryId, total_copies: Number(total) };
      if (book) {
        await api.put<Book>(`/books/${book.id}`, body);
        onSaved(`«${title}» se actualizó.`);
      } else {
        await api.post<Book>('/books', { ...body, isbn });
        onSaved(`«${title}» entró al catálogo.`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    } finally {
      setBusy(false);
    }
  }

  async function cover(file: File | undefined) {
    if (!book || !file) return;
    setError(null);
    try {
      await api.upload<Book>(`/books/${book.id}/cover`, file);
      onSaved(`La portada de «${book.title}» se guardó.`);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    }
  }

  async function removeCover() {
    if (!book) return;
    try {
      await api.delete(`/books/${book.id}/cover`);
      onSaved(`Se quitó la portada de «${book.title}».`);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
    }
  }

  return (
    <form className="card form-card" onSubmit={save} aria-label={book ? 'Editar libro' : 'Nuevo libro'}>
      <h2>{book ? 'Editar libro' : 'Nuevo libro'}</h2>
      <div className="grid-2">
        <label>
          Título
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={250} />
        </label>
        <label>
          Autor
          <input value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={200} />
        </label>
        <label>
          ISBN (13 dígitos)
          <input value={isbn} onChange={(e) => setIsbn(e.target.value)} required={!book} disabled={!!book} inputMode="numeric" pattern="\d{13}" />
        </label>
        <label>
          Categoría
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ejemplares en total
          <input type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} required />
        </label>
        {book && (
          <label>
            Portada (JPG o PNG, hasta 2 MB)
            <input type="file" accept="image/jpeg,image/png" onChange={(e) => cover(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <Notice error={error} />

      <div className="row-actions">
        <button type="submit" disabled={busy}>
          Guardar
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          Cancelar
        </button>
        {book?.cover_key && (
          <button type="button" className="ghost danger" onClick={removeCover}>
            Quitar portada
          </button>
        )}
      </div>
    </form>
  );
}
