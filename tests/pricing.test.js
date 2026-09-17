import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TIERS,
  VOUCHER_MIN,
  getTier,
  getNextTier,
  computeTotals,
  suggestUpgrade,
  normalizeQty,
  formatRupiah,
  buildOrderText,
} from '../src/lib/pricing.js';

test('batas tier voucher sesuai ketentuan poster', () => {
  const cases = [
    [0, 0],
    [699999, 0],
    [699999 + 1, 20],
    [999999, 20],
    [1000000, 22],
    [1499999, 22],
    [1500000, 25],
    [1999999, 25],
    [2000000, 26],
    [5000000, 26],
  ];
  for (const [total, percent] of cases) {
    assert.equal(getTier(total).percent, percent, `total ${total} harus diskon ${percent}%`);
  }
});

test('tier berurutan dan batasnya inklusif di bawah', () => {
  const vouchers = TIERS.filter((t) => t.percent > 0).map((t) => t.percent);
  assert.deepEqual(vouchers, [20, 22, 25, 26]);
  assert.equal(TIERS[0].min, 0);
  assert.equal(VOUCHER_MIN, 700000);
  assert.equal(getTier(700000).id, 'tier-20');
  assert.equal(getNextTier(getTier(700000)).percent, 22);
  assert.equal(getNextTier(getTier(2000000)), null);
});

test('normalizeQty menjaga input tetap integer 0..9999', () => {
  assert.equal(normalizeQty(''), 0);
  assert.equal(normalizeQty('abc'), 0);
  assert.equal(normalizeQty(-5), 0);
  assert.equal(normalizeQty('3.9'), 3);
  assert.equal(normalizeQty(7), 7);
  assert.equal(normalizeQty(99999), 9999);
  assert.equal(normalizeQty(undefined), 0);
});

test('formatRupiah memakai format rupiah tanpa desimal', () => {
  assert.equal(formatRupiah(89000), 'Rp89.000');
  assert.equal(formatRupiah(148600), 'Rp148.600');
  assert.equal(formatRupiah(0), 'Rp0');
});

test('computeTotals: 4 Sapi Ori + 4 Ayam Ori = Rp696.000 belum dapat voucher', () => {
  const totals = computeTotals({ 'fr-sapi-ori': 4, 'fr-ayam-ori': 4 });
  assert.equal(totals.totalQty, 8);
  assert.equal(totals.totalNormal, 696000);
  assert.equal(totals.discountPercent, 0);
  assert.equal(totals.discountAmount, 0);
  assert.equal(totals.totalBayar, 696000);
  assert.equal(totals.amountToNextTier, 4000);
  assert.equal(totals.isEmpty, false);
  assert.equal(totals.isVoucherActive, false);
  assert.equal(totals.lines.length, 2);
});

test('computeTotals: lewat Rp700.000 dapat diskon 20%', () => {
  const totals = computeTotals({ 'fr-sapi-ori': 4, 'fr-ayam-ori': 4, 'fr-ayam-ori-mini': 1 });
  assert.equal(totals.totalNormal, 743000);
  assert.equal(totals.discountPercent, 20);
  assert.equal(totals.discountAmount, 148600);
  assert.equal(totals.totalBayar, 594400);
  assert.equal(totals.savings, 148600);
  assert.equal(totals.isVoucherActive, true);
});

test('computeTotals: belanja Rp2.148.000 dapat diskon maksimal 26%', () => {
  const totals = computeTotals({ 'fr-sapi-ori': 12, 'rt-durian-sobek': 12 });
  assert.equal(totals.totalNormal, 2148000);
  assert.equal(totals.discountPercent, 26);
  assert.equal(totals.discountAmount, 558480);
  assert.equal(totals.totalBayar, 1589520);
  assert.equal(totals.nextTier, null);
  assert.equal(totals.amountToNextTier, 0);
});

test('computeTotals mengabaikan qty kosong / id tak dikenal', () => {
  const totals = computeTotals({ 'fr-sapi-ori': 0, 'id-ngawur': 5, 'bs-keju': '2' });
  assert.equal(totals.lines.length, 1);
  assert.equal(totals.lines[0].id, 'bs-keju');
  assert.equal(totals.lines[0].subtotal, 118000);
  assert.equal(totals.totalQty, 2);
  assert.equal(computeTotals({}).isEmpty, true);
  assert.equal(computeTotals().totalBayar, 0);
});

test('suggestUpgrade menyarankan tambahan termurah sampai tier berikutnya', () => {
  const upgrade = suggestUpgrade({ 'fr-sapi-ori': 4, 'fr-ayam-ori': 4 });
  assert.ok(upgrade, 'harus ada saran upgrade');
  assert.equal(upgrade.amountToNext, 4000);
  assert.equal(upgrade.cheapestPrice, 47000);
  assert.equal(upgrade.addQty, 1);
  assert.equal(upgrade.addCost, 47000);
  assert.equal(upgrade.newNormal, 743000);
  assert.equal(upgrade.tier.percent, 20);
  assert.equal(upgrade.newBayar, 594400);
  // 594.400 < 696.000 -> naik tier malah lebih hemat
  assert.ok(upgrade.extraBayar < 0);
  assert.equal(upgrade.extraBayar, 594400 - 696000);
});

test('suggestUpgrade null saat sudah di tier tertinggi', () => {
  assert.equal(suggestUpgrade({ 'rt-durian-sobek': 30 }), null);
});

test('buildOrderText berisi rincian dan total bayar', () => {
  const totals = computeTotals({ 'fr-sapi-ori': 4, 'fr-ayam-ori': 4, 'fr-ayam-ori-mini': 1 });
  const text = buildOrderText({
    customer: 'Bu Rina',
    note: 'kirim Senin',
    dateLabel: '17 Sep 2026, 10.00',
    lines: totals.lines,
    totalQty: totals.totalQty,
    totalNormal: totals.totalNormal,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    totalBayar: totals.totalBayar,
  });

  assert.match(text, /Bu Rina/);
  assert.match(text, /Sapi Ori x4 = Rp356\.000/);
  assert.match(text, /Harga normal : Rp743\.000/);
  assert.match(text, /Diskon       : 20% \(Rp148\.600\)/);
  assert.match(text, /\*TOTAL BAYAR : Rp594\.400\*/);
  assert.match(text, /kirim Senin/);
  assert.equal(buildOrderText(null), 'Belum ada varian yang diisi.');
});
