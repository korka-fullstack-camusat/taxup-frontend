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

interface ReceiptData {
  receipt_number: string;
  transaction_id: string;
  fiscal_period: string;
  total_amount: number;
  tax_amount: number;
  tax_rate: number;
  issued_at: string;
  is_cancelled: boolean;
}

function fxof(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

export function generateReceiptPDF(receipt: ReceiptData) {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;

  const issued = new Date(receipt.issued_at).toLocaleString('fr-FR');
  const status = receipt.is_cancelled
    ? '<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">Annulé</span>'
    : '<span style="background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">Valide</span>';

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Reçu Fiscal ${receipt.receipt_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; }
  .page { max-width: 640px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.10); }

  /* Header */
  .header { background: linear-gradient(135deg, #00853F 0%, #006830 100%); padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; }
  .header-left h1 { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
  .header-left p  { color: rgba(255,255,255,.75); font-size: 12px; margin-top: 2px; }
  .header-right { text-align: right; }
  .header-right .num { color: #fff; font-size: 14px; font-weight: 700; font-family: monospace; }
  .header-right .date { color: rgba(255,255,255,.65); font-size: 11px; margin-top: 4px; }

  /* Flag stripe */
  .flag { display: flex; height: 4px; }
  .flag span { flex: 1; }

  /* Body */
  .body { padding: 32px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px; }

  /* Rows */
  .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  .row:last-child { border-bottom: none; }
  .row .label { font-size: 13px; color: #64748b; }
  .row .value { font-size: 13px; font-weight: 600; color: #0f172a; }
  .row .mono  { font-family: monospace; font-size: 12px; }

  /* Totals */
  .totals { background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin-top: 24px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
  .total-row .tl { font-size: 13px; color: #64748b; }
  .total-row .tv { font-size: 13px; font-weight: 600; }
  .total-main { border-top: 2px solid #e2e8f0; margin-top: 8px; padding-top: 12px; }
  .total-main .tl { font-size: 15px; font-weight: 700; color: #0f172a; }
  .total-main .tv { font-size: 18px; font-weight: 800; color: #00853F; }

  /* Footer */
  .footer { padding: 16px 32px 24px; text-align: center; }
  .footer p { font-size: 11px; color: #94a3b8; line-height: 1.6; }
  .footer .bold { font-weight: 700; color: #64748b; }

  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; border-radius: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Flag stripe -->
  <div class="flag">
    <span style="background:#00853F"></span>
    <span style="background:#FDEF42"></span>
    <span style="background:#E31B23"></span>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>TAXUP</h1>
      <p>Direction Générale des Impôts et Domaines</p>
    </div>
    <div class="header-right">
      <div class="num">${receipt.receipt_number}</div>
      <div class="date">Émis le ${issued}</div>
      <div style="margin-top:6px">${status}</div>
    </div>
  </div>

  <!-- Body -->
  <div class="body">
    <div class="section-title">Informations du reçu</div>

    <div class="row">
      <span class="label">N° Reçu</span>
      <span class="value mono">${receipt.receipt_number}</span>
    </div>
    <div class="row">
      <span class="label">ID Transaction</span>
      <span class="value mono" style="font-size:11px">${receipt.transaction_id}</span>
    </div>
    <div class="row">
      <span class="label">Période fiscale</span>
      <span class="value">${receipt.fiscal_period}</span>
    </div>
    <div class="row">
      <span class="label">Date d'émission</span>
      <span class="value">${issued}</span>
    </div>
    <div class="row">
      <span class="label">Statut</span>
      <span class="value">${receipt.is_cancelled ? 'Annulé' : 'Valide'}</span>
    </div>

    <!-- Totaux -->
    <div class="totals">
      <div class="section-title" style="margin-bottom:8px">Détail financier</div>
      <div class="total-row">
        <span class="tl">Montant HT</span>
        <span class="tv">${fxof(receipt.total_amount - receipt.tax_amount)}</span>
      </div>
      <div class="total-row">
        <span class="tl">TVA (${(receipt.tax_rate * 100).toFixed(1)}%)</span>
        <span class="tv" style="color:#00853F">${fxof(receipt.tax_amount)}</span>
      </div>
      <div class="total-row total-main">
        <span class="tl">Montant Total TTC</span>
        <span class="tv">${fxof(receipt.total_amount)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p class="bold">TAXUP — Plateforme Nationale de Fiscalité Digitale du Sénégal</p>
    <p>Ce reçu fiscal est généré automatiquement et fait foi de paiement de taxes.</p>
    <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
  </div>
</div>

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
  };
<\/script>
</body>
</html>`);
  win.document.close();
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
