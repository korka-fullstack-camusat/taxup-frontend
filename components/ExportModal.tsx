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
        if (next.size === 1) return prev; // garder au moins 1 champ
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === fields.length) {
      setSelected(new Set([fields[0].key])); // garder au moins 1
    } else {
      setSelected(new Set(fields.map(f => f.key)));
    }
  };

  const activeFields = fields.filter(f => selected.has(f.key));

  const handleExport = async () => {
    if (activeFields.length === 0 || data.length === 0) return;
    setExporting(true);

    try {
      if (format === 'excel') {
        await exportExcel();
      } else {
        await exportPdf();
      }
    } finally {
      setExporting(false);
      onClose();
    }
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');

    const rows = data.map(row =>
      Object.fromEntries(activeFields.map(f => [f.label, formatValue(row[f.key])]))
    );

    const ws = utils.json_to_sheet(rows);

    // Largeur auto des colonnes
    const colWidths = activeFields.map(f => ({
      wch: Math.max(f.label.length, ...data.map(r => String(formatValue(r[f.key])).length)) + 2,
    }));
    ws['!cols'] = colWidths;

    // Style en-tête (couleur de fond bleu)
    const headerRange = utils.decode_range(ws['!ref'] || 'A1');
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const cellAddr = utils.encode_cell({ r: 0, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s = {
          fill: { fgColor: { rgb: '1E40AF' } },
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center' },
        };
      }
    }

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Données');
    writeFile(wb, `${filename}_${today()}.xlsx`);
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const orientation = activeFields.length > 5 ? 'landscape' : 'portrait';
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

    // En-tête du document
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('TAXUP — Plateforme Fiscale', 14, 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 14, 13);

    // Date d'export
    doc.setTextColor(200, 210, 255);
    doc.setFontSize(8);
    const pageW = doc.internal.pageSize.getWidth();
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - 14, 13, { align: 'right' });

    // Tableau
    autoTable(doc, {
      startY: 24,
      head: [activeFields.map(f => f.label)],
      body: data.map(row => activeFields.map(f => String(formatValue(row[f.key])))),
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [239, 246, 255],
      },
      styles: {
        cellPadding: 3,
        overflow: 'linebreak',
      },
      columnStyles: Object.fromEntries(
        activeFields.map((_, i) => [i, { halign: 'left' }])
      ),
      margin: { top: 24, left: 14, right: 14 },
      didDrawPage: (hookData) => {
        // Pied de page
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const pW = doc.internal.pageSize.getWidth();
        const pH = doc.internal.pageSize.getHeight();
        doc.text(`Page ${hookData.pageNumber} / ${pageCount}`, pW / 2, pH - 6, { align: 'center' });
        doc.text('© TAXUP — Document confidentiel', 14, pH - 6);
      },
    });

    doc.save(`${filename}_${today()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-blue-800">Exporter les données</h2>
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
                  <p className="text-xs text-gray-400">.xlsx</p>
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

          {/* Champs à inclure */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Colonnes à inclure
              </p>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {isSelected
                      ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-blue-500" />
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
              {format === 'excel' ? '.xlsx' : '.pdf'}
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

// ── Helpers ────────────────────────────────────────────────────────────────
function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return String(val);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
