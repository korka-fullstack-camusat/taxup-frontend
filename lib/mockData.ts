/**
 * Mock data for development/demo mode.
 * Enabled via NEXT_PUBLIC_USE_MOCK_DATA=true
 */

// Seeded pseudo-random for deterministic data (no hydration mismatches)
function mkRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rng = mkRng(42);
function ri(min: number, max: number) { return Math.floor(rng() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(rng() * arr.length)]; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(prefix: string, i: number) {
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return `${hex(i + 0x10000)}-${hex(i * 7)}-4${hex(i * 3).slice(1)}-a${hex(i * 5).slice(1)}-${prefix}${hex(i * 11).slice(0, 8)}`;
}

const SN_PHONES = ['221771', '221772', '221773', '221781', '221782', '221783', '221701', '221761'];
function phone() {
  const prefix = pick(SN_PHONES);
  const n = ri(100000, 999999);
  return `+${prefix}${n}`;
}

function daysAgo(n: number): string {
  const d = new Date('2026-04-03T12:00:00Z');
  d.setDate(d.getDate() - n);
  d.setHours(ri(0, 23), ri(0, 59), ri(0, 59));
  return d.toISOString();
}

function dateStr(daysBack: number): string {
  const d = new Date('2026-04-03');
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

// ─── Transactions (80 items) ──────────────────────────────────────────────────

const TX_TYPES = ['TRANSFER', 'PAYMENT', 'DEPOSIT', 'WITHDRAWAL', 'MOBILE_PAYMENT'];
const TX_STATUSES = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'PENDING', 'FLAGGED', 'FAILED'];
const TX_AMOUNTS = [5000, 10000, 15000, 25000, 50000, 75000, 100000, 150000, 200000, 500000, 750000, 1000000];

export const MOCK_TRANSACTIONS = Array.from({ length: 80 }, (_, i) => {
  const status = pick(TX_STATUSES);
  const type = pick(TX_TYPES);
  const amount = pick(TX_AMOUNTS) + ri(0, 4999);
  const riskScore = status === 'FLAGGED' ? rng() * 0.5 + 0.45 : rng() * 0.35;
  return {
    id: uid('tx', i + 1),
    transaction_type: type,
    amount,
    status,
    currency: 'XOF',
    created_at: daysAgo(ri(0, 59)),
    sender_phone: phone(),
    recipient_phone: type === 'DEPOSIT' || type === 'WITHDRAWAL' ? undefined : phone(),
    description: pick(['Transfert famille', 'Paiement facture', 'Achat en ligne', 'Remboursement', 'Paiement service', undefined, undefined]),
    risk_score: parseFloat(riskScore.toFixed(3)),
  };
});

// ─── Fraud Alerts (40 items) ──────────────────────────────────────────────────

const FRAUD_TYPES = [
  'UNUSUAL_PATTERN', 'UNUSUAL_PATTERN', 'STRUCTURING', 'STRUCTURING',
  'BLACKLISTED', 'BLACKLISTED', 'ROUND_TRIPPING', 'ROUND_TRIPPING',
  'VELOCITY_ABUSE', 'LARGE_AMOUNT', 'RAPID_TRANSFER', 'SUSPICIOUS_AMOUNT',
];
const FRAUD_STATUSES = ['PENDING', 'PENDING', 'PENDING', 'CONFIRMED', 'CONFIRMED', 'UNDER_REVIEW', 'DISMISSED'];

export const MOCK_FRAUD_ALERTS = Array.from({ length: 40 }, (_, i) => {
  const fraudType = pick(FRAUD_TYPES);
  const riskScore = parseFloat((rng() * 0.6 + 0.35).toFixed(2));
  return {
    id: uid('fr', i + 1),
    transaction_id: uid('tx', ri(1, 80)),
    fraud_type: fraudType,
    risk_score: riskScore,
    status: pick(FRAUD_STATUSES),
    details: { pattern: fraudType, confidence: riskScore },
    detected_at: daysAgo(ri(0, 89)),
  };
});

// ─── Audits (20 items) ───────────────────────────────────────────────────────

const AUDIT_STATUSES = ['OPEN', 'OPEN', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CLOSED'];
const AUDIT_PRIORITIES = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL'];
const AUDIT_TITLES = [
  'Audit conformité TVA Q1 2026',
  'Vérification opérateur mobile Dakar',
  'Contrôle transactions suspectes',
  'Audit revenus déclarés 2025',
  'Investigation fraude documentaire',
  'Analyse flux financiers anormaux',
  'Vérification identités contribuables',
  'Audit remboursements TVA',
  'Contrôle conformité réglementaire',
  'Analyse schémas de fraude détectés',
];

export const MOCK_AUDITS = Array.from({ length: 20 }, (_, i) => ({
  id: uid('au', i + 1),
  title: AUDIT_TITLES[i % AUDIT_TITLES.length],
  status: pick(AUDIT_STATUSES),
  priority: pick(AUDIT_PRIORITIES),
  created_at: daysAgo(ri(5, 120)),
  operator_name: pick(['Orange Sénégal', 'Free Sénégal', 'Expresso', 'Wave', 'Wari', undefined]),
  findings_count: ri(0, 15),
}));

// ─── Fiscal Receipts (30 items) ───────────────────────────────────────────────

const FISCAL_PERIODS = ['2026-01', '2026-02', '2026-03', '2025-12', '2025-11', '2025-10'];

export const MOCK_RECEIPTS = Array.from({ length: 30 }, (_, i) => {
  const totalAmount = pick([50000, 75000, 100000, 150000, 200000, 350000, 500000]) + ri(0, 9999);
  const taxAmount = Math.round(totalAmount * 0.18);
  return {
    id: uid('rc', i + 1),
    receipt_number: `RC-2026-${String(i + 1001).padStart(6, '0')}`,
    total_amount: totalAmount,
    tax_amount: taxAmount,
    fiscal_period: pick(FISCAL_PERIODS),
    issued_at: daysAgo(ri(0, 90)),
  };
});

// ─── Dashboard Overview (DGID) ────────────────────────────────────────────────

export const MOCK_OVERVIEW = {
  transactions: {
    total: 8432,
    pending: 156,
    completed: 7845,
    failed: 231,
    total_volume: 5_678_900_000,
  },
  fraud: {
    total_alerts: 287,
    pending_alerts: 124,
    high_risk: 68,
  },
  audits: {
    total: 156,
    open: 34,
    in_progress: 22,
    completed: 100,
  },
  fiscal: {
    total_receipts: 2341,
    month_tax_collected_xof: 42_567_890,
  },
};

// ─── Dashboard Admin Summary ──────────────────────────────────────────────────

export const MOCK_ADMIN_SUMMARY = {
  users: {
    total: 1247,
    active: 1089,
    by_role: {
      CITOYEN: 856,
      OPERATEUR_MOBILE: 124,
      AUDITEUR_FISCAL: 47,
      AGENT_DGID: 18,
      ADMIN: 5,
    },
  },
  transactions: {
    total_transactions: 8432,
    today_transactions: 234,
    month_volume: 2_456_780_000,
    pending_transactions: 156,
  },
  fraud: {
    total_alerts: 287,
    confirmed_fraud: 89,
    pending_alerts: 124,
    by_type: {
      UNUSUAL_PATTERN: 78,
      STRUCTURING: 65,
      BLACKLISTED: 54,
      ROUND_TRIPPING: 43,
      VELOCITY_ABUSE: 32,
      LARGE_AMOUNT: 15,
    },
  },
  audits: {
    total: 156,
    open: 34,
    in_progress: 22,
    completed: 100,
  },
  fiscal: {
    total_receipts: 2341,
    month_tax_collected_xof: 42_567_890,
    total_tax_collected_xof: 567_234_567,
    total_volume_xof: 5_678_900_000,
  },
};

// ─── Dashboard Evolution (up to 90 days) ─────────────────────────────────────

const rngEvo = mkRng(123);
function riEvo(min: number, max: number) { return Math.floor(rngEvo() * (max - min + 1)) + min; }

const EVOLUTION_90: Array<{
  date: string; transactions: number; volume: number;
  fraud_alerts: number; tax_collected: number; new_users: number; receipts: number;
}> = Array.from({ length: 90 }, (_, i) => ({
  date: dateStr(89 - i),
  transactions: riEvo(150, 350),
  volume: riEvo(40_000_000, 120_000_000),
  fraud_alerts: riEvo(2, 18),
  tax_collected: riEvo(800_000, 2_500_000),
  new_users: riEvo(5, 35),
  receipts: riEvo(30, 90),
}));

export function getEvolution(days: number) {
  return EVOLUTION_90.slice(-Math.min(days, 90));
}

// ─── Dashboard Realtime ───────────────────────────────────────────────────────

export const MOCK_REALTIME = {
  by_type: [
    { type: 'TRANSFER', count: 89, volume: 44_500_000 },
    { type: 'PAYMENT', count: 64, volume: 12_800_000 },
    { type: 'DEPOSIT', count: 38, volume: 9_500_000 },
    { type: 'WITHDRAWAL', count: 27, volume: 6_750_000 },
    { type: 'MOBILE_PAYMENT', count: 16, volume: 2_400_000 },
  ],
  by_status: [
    { status: 'COMPLETED', count: 198 },
    { status: 'PENDING', count: 23 },
    { status: 'FAILED', count: 8 },
    { status: 'FLAGGED', count: 5 },
  ],
  recent_fraud_alerts: MOCK_FRAUD_ALERTS.slice(0, 8).map(a => ({
    id: a.id,
    fraud_type: a.fraud_type,
    risk_score: a.risk_score,
    detected_at: a.detected_at,
  })),
};

// ─── Router ───────────────────────────────────────────────────────────────────

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number } {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length };
}

export function getMockResponse(url: string, params: Record<string, string> = {}): unknown | null {
  const path = url.split('?')[0].replace(/\/$/, '');

  // Transactions
  if (path === '/transactions') {
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.page_size || '20');
    let items = [...MOCK_TRANSACTIONS];
    if (params.status) items = items.filter(t => t.status === params.status);
    if (params.transaction_type) items = items.filter(t => t.transaction_type === params.transaction_type);
    // Sort by date desc
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return paginate(items, page, pageSize);
  }

  // Fraud alerts
  if (path === '/fraud/alerts') {
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.page_size || '20');
    let items = [...MOCK_FRAUD_ALERTS];
    if (params.status) items = items.filter(a => a.status === params.status);
    if (params.min_risk_score) items = items.filter(a => a.risk_score >= parseFloat(params.min_risk_score));
    items.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
    return paginate(items, page, pageSize);
  }

  // Audits
  if (path === '/audits') {
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.page_size || '10');
    const items = [...MOCK_AUDITS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return paginate(items, page, pageSize);
  }

  // Receipts
  if (path === '/receipts') {
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.page_size || '10');
    const items = [...MOCK_RECEIPTS].sort(
      (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime(),
    );
    return paginate(items, page, pageSize);
  }

  // Dashboard DGID
  if (path === '/dashboard/overview') return MOCK_OVERVIEW;
  if (path === '/dashboard/realtime') return MOCK_REALTIME;
  if (path === '/dashboard/evolution') {
    const days = parseInt(params.days || '30');
    return { evolution: getEvolution(days) };
  }

  // Dashboard Admin
  if (path === '/dashboard/admin-summary') return MOCK_ADMIN_SUMMARY;

  // Auth – never mock; let real handler run
  if (path.startsWith('/auth/')) return null;

  return null;
}
