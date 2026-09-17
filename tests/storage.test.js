import test from 'node:test';
import assert from 'node:assert/strict';

/** localStorage tiruan minimalis untuk menguji modul storage di Node. */
class MemoryStorage {
  #map = new Map();
  getItem(key) {
    return this.#map.has(key) ? this.#map.get(key) : null;
  }
  setItem(key, value) {
    this.#map.set(key, String(value));
  }
  removeItem(key) {
    this.#map.delete(key);
  }
  clear() {
    this.#map.clear();
  }
}

globalThis.localStorage = new MemoryStorage();

const store = await import('../src/lib/storage.js');
const { computeTotals } = await import('../src/lib/pricing.js');

function makeOrder(overrides = {}) {
  const totals = computeTotals({ 'fr-sapi-ori': 4, 'fr-ayam-ori': 4, 'fr-ayam-ori-mini': 1 });
  return {
    id: 'ord-1',
    createdAt: '2026-09-17T03:00:00.000Z',
    customer: 'Bu Rina',
    note: 'kirim Senin',
    lines: totals.lines,
    totalQty: totals.totalQty,
    totalNormal: totals.totalNormal,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    totalBayar: totals.totalBayar,
    ...overrides,
  };
}

test('simpan, muat, dan hapus riwayat di localStorage', () => {
  localStorage.clear();
  let history = store.loadHistory();
  assert.deepEqual(history, []);

  history = store.addOrder(history, makeOrder());
  assert.equal(history.length, 1);
  assert.equal(store.loadHistory().length, 1);
  assert.equal(store.loadHistory()[0].totalBayar, 594400);

  history = store.addOrder(history, makeOrder({ id: 'ord-2' }));
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'ord-2', 'order terbaru di urutan pertama');

  history = store.removeOrder(history, 'ord-1');
  assert.deepEqual(history.map((o) => o.id), ['ord-2']);

  history = store.clearHistory();
  assert.deepEqual(history, []);
  assert.deepEqual(store.loadHistory(), []);
});

test('sanitizeOrder menolak data kosong dan menghitung ulang qty', () => {
  assert.equal(store.sanitizeOrder(null), null);
  assert.equal(store.sanitizeOrder({ lines: [] }), null);
  assert.equal(store.sanitizeOrder({ lines: [{ id: 'x', qty: 0 }] }), null);

  const clean = store.sanitizeOrder({ lines: [{ id: 'fr-sapi-ori', variant: 'Sapi Ori', price: 89000, qty: '4' }] });
  assert.equal(clean.totalQty, 4);
  assert.equal(clean.totalNormal, 356000);
  assert.ok(clean.dateLabel.length > 0);
});

test('ekspor lalu impor riwayat tanpa duplikasi', () => {
  localStorage.clear();
  let history = store.addOrder([], makeOrder());
  const text = store.exportHistoryText(history);

  const same = store.importHistoryText(history, text);
  assert.equal(same.ok, false, 'order yang sama tidak diimpor ulang');
  assert.equal(same.list.length, 1);

  const other = store.importHistoryText([], text);
  assert.equal(other.ok, true);
  assert.equal(other.list.length, 1);
  assert.equal(other.list[0].id, 'ord-1');

  const broken = store.importHistoryText(history, 'bukan json');
  assert.equal(broken.ok, false);
  assert.match(broken.message, /tidak valid/);
});

test('draft tersimpan dan pulih apa adanya', () => {
  localStorage.clear();
  assert.deepEqual(store.loadDraft(), { qty: {}, customer: '', note: '' });

  store.saveDraft({ qty: { 'fr-sapi-ori': 3, 'bs-keju': 0 }, customer: 'Pak Andi', note: 'tanpa box' });
  const draft = store.loadDraft();
  assert.deepEqual(draft.qty, { 'fr-sapi-ori': 3 });
  assert.equal(draft.customer, 'Pak Andi');
  assert.equal(draft.note, 'tanpa box');

  store.clearDraft();
  assert.deepEqual(store.loadDraft().qty, {});
});

test('format tanggal label Indonesia', () => {
  assert.match(store.formatDateLabel('2026-09-17T03:00:00.000Z'), /2026/);
  assert.equal(store.formatDayLabel(new Date().toISOString()), 'Hari ini');
  assert.match(store.formatClock('2026-09-17T03:00:00.000Z'), /^\d{2}[.:]\d{2}$/);
});
