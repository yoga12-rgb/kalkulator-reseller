/**
 * Logika perhitungan diskon reseller.
 * Ketentuan voucher (berdasarkan TOTAL HARGA NORMAL sebelum diskon):
 *   - Rp700.000 s/d di bawah Rp1.000.000  -> 20%
 *   - Rp1.000.000 s/d di bawah Rp1.500.000 -> 22%
 *   - Rp1.500.000 s/d di bawah Rp2.000.000 -> 25%
 *   - di atas Rp2.000.000                  -> 26%
 *   - di bawah Rp700.000                   -> belum dapat voucher (0%)
 */

import { PRODUCTS, CHEAPEST_PRICE } from './catalog.js';

export const TIERS = [
  {
    id: 'none',
    min: 0,
    max: 700000,
    percent: 0,
    label: 'Di bawah Rp700.000',
    headline: 'BELUM DAPAT VOUCHER',
    detail: 'Minimal pembelian Rp700.000',
  },
  {
    id: 'tier-20',
    min: 700000,
    max: 1000000,
    percent: 20,
    label: 'Rp700.000 – di bawah Rp1JT',
    headline: '700RB S/D DI BAWAH 1JT',
    detail: 'DISKON 20%',
  },
  {
    id: 'tier-22',
    min: 1000000,
    max: 1500000,
    percent: 22,
    label: 'Rp1JT – di bawah Rp1,5JT',
    headline: '1JT S/D DI BAWAH 1,5JT',
    detail: 'DISKON 22%',
  },
  {
    id: 'tier-25',
    min: 1500000,
    max: 2000000,
    percent: 25,
    label: 'Rp1,5JT – di bawah Rp2JT',
    headline: '1,5JT S/D DI BAWAH 2JT',
    detail: 'DISKON 25%',
  },
  {
    id: 'tier-26',
    min: 2000000,
    max: Infinity,
    percent: 26,
    label: 'Di atas Rp2JT',
    headline: 'DI ATAS 2JT',
    detail: 'DISKON 26%',
  },
];

export const MAX_DISCOUNT_PERCENT = 26;
export const VOUCHER_MIN = 700000;

/** Bulatkan qty ke bilangan bulat >= 0 (maks 9999) supaya input bebas tetap aman. */
export function normalizeQty(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, 9999);
}

/** Tier berlaku untuk total harga normal tertentu (batas bawah inklusif, batas atas eksklusif). */
export function getTier(totalNormal) {
  const total = Number(totalNormal) || 0;
  return TIERS.find((t) => total >= t.min && total < t.max) ?? TIERS[TIERS.length - 1];
}

/** Tier berikutnya yang lebih menguntungkan (null kalau sudah di tier tertinggi). */
export function getNextTier(tier) {
  return TIERS.find((t) => t.percent > tier.percent) ?? null;
}

export function formatRupiah(value) {
  const n = Math.round(Number(value) || 0);
  return 'Rp' + new Intl.NumberFormat('id-ID').format(n);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

/**
 * Hitung total belanja dari map { productId: qty }.
 * @param {Record<string, number|string>} qtyMap
 */
export function computeTotals(qtyMap = {}) {
  const lines = [];
  let totalQty = 0;
  let totalNormal = 0;

  for (const product of PRODUCTS) {
    const qty = normalizeQty(qtyMap[product.id]);
    if (qty === 0) continue;
    const subtotal = qty * product.price;
    lines.push({
      id: product.id,
      category: product.category,
      variant: product.variant,
      price: product.price,
      qty,
      subtotal,
    });
    totalQty += qty;
    totalNormal += subtotal;
  }

  const tier = getTier(totalNormal);
  const discountAmount = Math.round((totalNormal * tier.percent) / 100);
  const totalBayar = totalNormal - discountAmount;
  const nextTier = getNextTier(tier);
  const amountToNextTier = nextTier ? Math.max(0, nextTier.min - totalNormal) : 0;

  return {
    lines,
    totalQty,
    totalNormal,
    tier,
    discountPercent: tier.percent,
    discountAmount,
    totalBayar,
    savings: discountAmount,
    nextTier,
    amountToNextTier,
    isEmpty: totalQty === 0,
    isVoucherActive: tier.percent > 0,
  };
}

/**
 * Saran termurah untuk naik ke tier berikutnya.
 * Mengasumsikan penambahan varian dengan harga paling murah.
 * extraBayar negatif artinya reseller justru lebih hemat setelah naik tier.
 */
export function suggestUpgrade(qtyMap = {}) {
  const totals = computeTotals(qtyMap);
  const nextTier = totals.nextTier;
  if (!nextTier) return null;

  const amountToNext = totals.amountToNextTier;
  const addQty = Math.max(1, Math.ceil(amountToNext / CHEAPEST_PRICE));
  const addCost = addQty * CHEAPEST_PRICE;
  const newNormal = totals.totalNormal + addCost;
  const newTier = getTier(newNormal);
  const newBayar = newNormal - Math.round((newNormal * newTier.percent) / 100);

  return {
    tier: newTier,
    amountToNext,
    addQty,
    cheapestPrice: CHEAPEST_PRICE,
    addCost,
    newNormal,
    newBayar,
    extraBayar: newBayar - totals.totalBayar,
  };
}

/** Ringkasan teks siap kirim (WhatsApp/chat) untuk satu order. */
export function buildOrderText(order) {
  if (!order || !order.lines?.length) return 'Belum ada varian yang diisi.';
  const rows = order.lines.map((line) => {
    return `• ${line.variant} x${line.qty} = ${formatRupiah(line.subtotal)}`;
  });

  const parts = [
    '*RAJAKLANA — Abon Gulung & Bolu Susu*',
    'Estimasi Order Reseller',
    '',
    `Nama/Catatan : ${order.customer?.trim() || '-'}`,
    `Tanggal      : ${order.dateLabel ?? ''}`,
    '',
    '*Rincian Varian*',
    ...rows,
    '',
    `Total varian : ${formatNumber(order.totalQty)} pcs`,
    `Harga normal : ${formatRupiah(order.totalNormal)}`,
    `Diskon       : ${order.discountPercent}% (${formatRupiah(order.discountAmount)})`,
    `*TOTAL BAYAR : ${formatRupiah(order.totalBayar)}*`,
  ];

  if (order.note?.trim()) {
    parts.push('', `Catatan: ${order.note.trim()}`);
  }
  parts.push('', '_Dihitung dengan Kalkulator Reseller_');
  return parts.join('\n');
}
