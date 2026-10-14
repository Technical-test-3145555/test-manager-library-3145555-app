import { useState } from 'react';
import { api } from '../../api/client';
import type { MostBorrowedReport } from '../../api/types';
import { Empty, Notice } from '../../components/ui';
import { useQuery } from '../../hooks/useQuery';

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export function ReportPage() {
  const [from, setFrom] = useState(isoDay(-30));
  const [to, setTo] = useState(isoDay(0));
  const report = useQuery(() => api.get<MostBorrowedReport>('/reports/most-borrowed', { from, to }), [from, to]);

  const max = Math.max(1, ...(report.data?.rows.map((row) => row.times_borrowed) ?? [1]));

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Reporte</p>
          <h1>Los libros más prestados</h1>
          <p className="muted">Títulos y categorías tal como estaban el día del préstamo.</p>
        </div>
      </div>

      <div className="toolbar">
        <label className="inline-label">
          Desde
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="inline-label">
          Hasta
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <Notice error={report.error} />
      {report.data && report.data.rows.length === 0 && <Empty>No hubo préstamos en ese periodo.</Empty>}

      <ol className="ranking">
        {report.data?.rows.map((row, index) => (
          <li key={`${row.book_id}-${row.category_name}`} className="card rank">
            <span className="rank-pos" aria-hidden="true">
              {index + 1}
            </span>
            <div className="rank-body">
              <h3>{row.book_title}</h3>
              <p className="muted">{row.category_name}</p>
              <div className="bar" aria-hidden="true">
                <span style={{ width: `${(row.times_borrowed / max) * 100}%` }} />
              </div>
            </div>
            <strong className="rank-count">
              {row.times_borrowed} {row.times_borrowed === 1 ? 'vez' : 'veces'}
            </strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
