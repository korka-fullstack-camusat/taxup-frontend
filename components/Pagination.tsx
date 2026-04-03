'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

/** Génère la liste des numéros à afficher avec ellipsis (null = '…') */
function buildPages(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | null)[] = [];
  const left  = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  pages.push(1);
  if (left > 2) pages.push(null);
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push(null);
  pages.push(total);

  return pages;
}

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  if (total === 0) return null;

  const pages = buildPages(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-white">

      {/* Résumé */}
      <p className="text-sm text-gray-500 shrink-0">
        <span className="font-medium text-gray-700">{from}–{to}</span> sur{' '}
        <span className="font-medium text-gray-700">{total}</span> résultat{total > 1 ? 's' : ''}
      </p>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Précédent */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Page précédente"
          className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Préc.</span>
        </button>

        {/* Numéros */}
        {pages.map((p, idx) =>
          p === null ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-[36px] px-2.5 py-1.5 text-sm rounded-lg border transition-colors ${
                p === page
                  ? 'bg-green-700 border-green-700 text-white font-semibold shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Suivant */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Page suivante"
          className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Suiv.</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Taille de page */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <span className="hidden sm:inline">Lignes :</span>
          <select
            value={pageSize}
            onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {pageSizeOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
