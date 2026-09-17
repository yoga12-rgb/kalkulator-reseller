/**
 * Penyimpanan lokal (localStorage) untuk riwayat order + draft input.
 * Semua akses dibungkus try/catch supaya aplikasi tetap jalan saat
 * localStorage diblokir (mode private / storage penuh).
 */

const KEY_HISTORY = 'rajaklana.history.v1';
const KEY_DRAFT = 'rajaklana.draft.v1';
const MAX_HISTORY = 200;

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function readJSON(key, fallback) {
  if (!hasStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  if (!hasStorage()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ tanggal */

export function formatDateLabel(iso) {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function formatDayLabel(iso) {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return '-';
  const today = new Date();
  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (isSameDay(date, today)) return 'Hari ini';
  if (isSameDay(date, new Date(today.getTime() - 86400000))) return 'Kemarin';
  try {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return '-';
  }
}

export function formatClock(iso) {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ riwayat */

function sanitizeLine(line) {
  const price = Number(line?.price) || 0;
  const qty = Number(line?.qty) || 0;
  return {
    id: String(line?.id ?? ''),
    category: String(line?.category ?? ''),
    variant: String(line?.variant ?? ''),
    price,
    qty,
    // subtotal diambil dari data, kalau tidak ada dihitung ulang dari harga x qty
    subtotal: Number(line?.subtotal) || price * qty,
  };
}

export function sanitizeOrder(order) {
  if (!order || typeof order !== 'object') return null;
  const lines = Array.isArray(order.lines) ? order.lines.map(sanitizeLine).filter((l) => l.qty > 0) : [];
  if (!lines.length) return null;
  const createdAt =
    order.createdAt && !Number.isNaN(new Date(order.createdAt).getTime())
      ? order.createdAt
      : new Date().toISOString();
  return {
    id: String(order.id ?? `ord-${Date.now()}`),
    createdAt,
    dateLabel: String(order.dateLabel ?? formatDateLabel(createdAt)),
    customer: String(order.customer ?? ''),
    note: String(order.note ?? ''),
    lines,
    totalQty: Number(order.totalQty) || lines.reduce((sum, l) => sum + l.qty, 0),
    totalNormal: Number(order.totalNormal) || lines.reduce((sum, l) => sum + l.subtotal, 0),
    discountPercent: Number(order.discountPercent) || 0,
    discountAmount: Number(order.discountAmount) || 0,
    totalBayar: Number(order.totalBayar) || 0,
  };
}

export function loadHistory() {
  const raw = readJSON(KEY_HISTORY, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeOrder).filter(Boolean).slice(0, MAX_HISTORY);
}

export function saveHistory(list) {
  const clean = (Array.isArray(list) ? list : []).map(sanitizeOrder).filter(Boolean).slice(0, MAX_HISTORY);
  writeJSON(KEY_HISTORY, clean);
  return clean;
}

export function addOrder(list, order) {
  const clean = sanitizeOrder(order);
  if (!clean) return Array.isArray(list) ? list : [];
  return saveHistory([clean, ...(Array.isArray(list) ? list : [])]);
}

export function removeOrder(list, id) {
  return saveHistory((Array.isArray(list) ? list : []).filter((o) => o.id !== id));
}

export function clearHistory() {
  return saveHistory([]);
}

export function totalOmzet(list) {
  return (Array.isArray(list) ? list : []).reduce((sum, o) => sum + (Number(o.totalBayar) || 0), 0);
}

export function exportHistoryText(list) {
  return JSON.stringify(
    { app: 'kalkulator-reseller', version: 1, exportedAt: new Date().toISOString(), orders: list ?? [] },
    null,
    2,
  );
}

/** Import dari file export: gabungkan (dedupe by id) tanpa menghapus data lama. */
export function importHistoryText(list, text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: 'File tidak valid (bukan JSON).', list: list ?? [] };
  }
  const incoming = Array.isArray(parsed) ? parsed : parsed?.orders;
  if (!Array.isArray(incoming)) {
    return { ok: false, message: 'Struktur file tidak dikenali.', list: list ?? [] };
  }
  const current = Array.isArray(list) ? list : [];
  const seen = new Set(current.map((o) => o.id));
  const added = [];
  for (const item of incoming) {
    const clean = sanitizeOrder(item);
    if (clean && !seen.has(clean.id)) {
      seen.add(clean.id);
      added.push(clean);
    }
  }
  if (!added.length) {
    return { ok: false, message: 'Tidak ada order baru di file ini.', list: current };
  }
  const merged = saveHistory(
    [...added, ...current].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  );
  return { ok: true, message: `${added.length} order berhasil diimpor.`, list: merged };
}

/* -------------------------------------------------------------------- draft */

export function loadDraft() {
  const raw = readJSON(KEY_DRAFT, null);
  if (!raw || typeof raw !== 'object') return { qty: {}, customer: '', note: '' };
  const qty = {};
  if (raw.qty && typeof raw.qty === 'object') {
    for (const [id, value] of Object.entries(raw.qty)) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) qty[id] = Math.min(Math.floor(n), 9999);
    }
  }
  return {
    qty,
    customer: String(raw.customer ?? ''),
    note: String(raw.note ?? ''),
  };
}

export function saveDraft({ qty, customer, note }) {
  writeJSON(KEY_DRAFT, { qty: qty ?? {}, customer: customer ?? '', note: note ?? '' });
}

export function clearDraft() {
  if (!hasStorage()) return;
  try {
    localStorage.removeItem(KEY_DRAFT);
  } catch {
    /* ignore */
  }
}
