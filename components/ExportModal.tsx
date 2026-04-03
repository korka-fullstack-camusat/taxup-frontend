'use client';

import { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, CheckSquare, Square } from 'lucide-react';

export interface ExportField {
  key: string;
  label: string;
  defaultSelected?: boolean;
}

interface ExportModalProps {
  title: string;
  fields: ExportField[];
  data: Record<string, unknown>[];
  filename?: string;
  onClose: () => void;
}

type ExportFormat = 'excel' | 'pdf';

export default function ExportModal({ title, fields, data, filename = 'export', onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(fields.filter(f => f.defaultSelected !== false).map(f => f.key))
  );
  const [exporting, setExporting] = useState(false);

  const toggleField = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === fields.length) {
      setSelected(new Set([fields[0].key]));
    } else {
      setSelected(new Set(fields.map(f => f.key)));
    }
  };

  const activeFields = fields.filter(f => selected.has(f.key));

  const handleExport = () => {
    if (activeFields.length === 0 || data.length === 0) return;
    setExporting(true);
    try {
      if (format === 'excel') exportExcel();
      else exportPdf();
    } finally {
      setExporting(false);
      onClose();
    }
  };

  // ── Excel via XML Spreadsheet 2003 (aucune dépendance) ──────────────────
  const exportExcel = () => {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const headerRow = activeFields
      .map(f => `<Cell ss:StyleID="header"><Data ss:Type="String">${esc(f.label)}</Data></Cell>`)
      .join('');

    const dataRows = data
      .map(row =>
        '<Row>' +
        activeFields
          .map(f => {
            const val = formatValue(row[f.key]);
            return `<Cell ss:StyleID="cell"><Data ss:Type="String">${esc(val)}</Data></Cell>`;
          })
          .join('') +
        '</Row>'
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/>
      <Interior ss:Color="#00853F" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
    <Style ss:ID="cell">
      <Font ss:Size="9"/>
      <Alignment ss:WrapText="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Données">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

    downloadBlob(
      new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' }),
      `${filename}_${today()}.xls`
    );
  };

  // ── PDF via fenêtre d'impression stylisée (aucune dépendance) ───────────
  const exportPdf = () => {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const headerCells = activeFields.map(f => `<th>${esc(f.label)}</th>`).join('');
    const bodyRows = data
      .map(row =>
        '<tr>' +
        activeFields.map(f => `<td>${esc(formatValue(row[f.key]))}</td>`).join('') +
        '</tr>'
      )
      .join('');

    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 9pt; color: #1e293b; }
    .page-header {
      background: #00853F; color: #fff; padding: 10px 16px;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px;
    }
    .page-header h1 { font-size: 13pt; font-weight: bold; }
    .page-header .sub { font-size: 8pt; color: #86efac; margin-top: 2px; }
    .page-header .date { font-size: 8pt; color: #86efac; text-align: right; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #00853F; color: #fff; }
    thead th {
      padding: 6px 8px; font-size: 8pt; font-weight: bold;
      text-align: left; border: 1px solid #005f2e;
    }
    tbody tr:nth-child(even) { background: #f0fdf4; }
    tbody td {
      padding: 5px 8px; font-size: 8pt; border: 1px solid #e2e8f0;
      vertical-align: top; word-break: break-word;
    }
    .footer {
      margin-top: 16px; font-size: 7pt; color: #94a3b8;
      display: flex; justify-content: space-between;
    }
    @media print {
      @page { margin: 12mm; size: ${activeFields.length > 5 ? 'A4 landscape' : 'A4 portrait'}; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <div>
      <h1>TAXUP — Plateforme Fiscale</h1>
      <div class="sub">${esc(title)}</div>
    </div>
    <div class="date">Exporté le ${dateStr}<br/>${data.length} enregistrement${data.length !== 1 ? 's' : ''}</div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">
    <span>© TAXUP — Document confidentiel</span>
    <span>Généré le ${dateStr}</span>
  </div>
  <script>
    window.onload = function () { window.print(); window.onafterprint = function () { window.close(); }; };
  </script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-green-50 border-b border-green-100">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-700" />
            <h2 className="text-base font-bold text-green-900">Exporter les données</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Format */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Format d&apos;export</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  format === 'excel'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <FileSpreadsheet className={`h-6 w-6 ${format === 'excel' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold ${format === 'excel' ? 'text-green-700' : 'text-gray-600'}`}>Excel</p>
                  <p className="text-xs text-gray-400">.xls</p>
                </div>
                {format === 'excel' && (
                  <div className="ml-auto h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  format === 'pdf'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <FileText className={`h-6 w-6 ${format === 'pdf' ? 'text-red-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold ${format === 'pdf' ? 'text-red-700' : 'text-gray-600'}`}>PDF</p>
                  <p className="text-xs text-gray-400">.pdf</p>
                </div>
                {format === 'pdf' && (
                  <div className="ml-auto h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Colonnes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Colonnes à inclure</p>
              <button
                onClick={toggleAll}
                className="text-xs text-green-700 hover:text-green-900 font-medium transition-colors"
              >
                {selected.size === fields.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {fields.map(f => {
                const isSelected = selected.has(f.key);
                return (
                  <button
                    key={f.key}
                    onClick={() => toggleField(f.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left ${
                      isSelected
                        ? 'border-green-400 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {isSelected
                      ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-green-600" />
                      : <Square className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    }
                    <span className="truncate">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-gray-800">{data.length}</span> ligne{data.length !== 1 ? 's' : ''} ·{' '}
              <span className="font-semibold text-gray-800">{selected.size}</span> colonne{selected.size !== 1 ? 's' : ''}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${format === 'excel' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {format === 'excel' ? '.xls' : '.pdf'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || selected.size === 0}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                format === 'excel' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Export en cours...' : `Exporter en ${format === 'excel' ? 'Excel' : 'PDF'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return String(val);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
