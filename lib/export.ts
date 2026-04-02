/**
 * Export utilities for CSV, Excel-like (TSV), and print/PDF
 */

export function exportCSV(data: Record<string, unknown>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data.length) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );

  const csv = '\uFEFF' + [header, ...rows].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}

export function exportExcel(data: Record<string, unknown>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data.length) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => c.label).join('\t');
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      return String(val);
    }).join('\t')
  );

  const tsv = [header, ...rows].join('\n');
  downloadFile(tsv, `${filename}.xls`, 'application/vnd.ms-excel');
}

export function exportPDF(title: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = document.querySelector('main')?.innerHTML || document.querySelector('[data-export]')?.innerHTML || '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #1e40af; font-size: 20px; margin-bottom: 5px; }
        h2 { color: #666; font-size: 14px; font-weight: normal; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
        td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        tr:hover { background: #f9fafb; }
        .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header-info">
        <div>
          <h1>TAXUP - ${title}</h1>
          <h2>G\u00e9n\u00e9r\u00e9 le ${new Date().toLocaleDateString('fr-FR')} \u00e0 ${new Date().toLocaleTimeString('fr-FR')}</h2>
        </div>
      </div>
      ${content}
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
