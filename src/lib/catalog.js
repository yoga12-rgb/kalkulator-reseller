/**
 * Katalog produk Rajaklana.
 * Sumber harga: tabel harga satuan normal (Floss Roll / Bolu Susu / Roti).
 * Semua harga dalam Rupiah (bilangan bulat, tanpa desimal).
 */

export const CATEGORIES = [
  {
    id: 'floss-roll',
    name: 'Floss Roll',
    tagline: 'Abon gulung premium',
    icon: 'roll',
  },
  {
    id: 'bolu-susu',
    name: 'Bolu Susu',
    tagline: 'Bolu susu lembut',
    icon: 'cake',
  },
  {
    id: 'roti',
    name: 'Roti',
    tagline: 'Roti durian sobek',
    icon: 'bread',
  },
];

export const PRODUCTS = [
  { id: 'fr-sapi-ori', category: 'floss-roll', variant: 'Sapi Ori', price: 89000, note: '' },
  { id: 'fr-sapi-pedas', category: 'floss-roll', variant: 'Sapi Pedas', price: 89000, note: '' },
  { id: 'fr-ayam-ori', category: 'floss-roll', variant: 'Ayam Ori', price: 85000, note: '' },
  { id: 'fr-ayam-pedas', category: 'floss-roll', variant: 'Ayam Pedas', price: 85000, note: '' },
  { id: 'fr-sapi-ori-mini', category: 'floss-roll', variant: 'Sapi Ori Mini', price: 50000, note: 'mini' },
  { id: 'fr-sapi-pedas-mini', category: 'floss-roll', variant: 'Sapi Pedas Mini', price: 50000, note: 'mini' },
  { id: 'fr-ayam-ori-mini', category: 'floss-roll', variant: 'Ayam Ori Mini', price: 47000, note: 'mini' },
  { id: 'fr-ayam-pedas-mini', category: 'floss-roll', variant: 'Ayam Pedas Mini', price: 47000, note: 'mini' },
  { id: 'bs-keju', category: 'bolu-susu', variant: 'Bolu Keju', price: 59000, note: '' },
  { id: 'bs-coklat', category: 'bolu-susu', variant: 'Bolu Coklat', price: 59000, note: '' },
  { id: 'bs-durian', category: 'bolu-susu', variant: 'Bolu Durian', price: 65000, note: '' },
  { id: 'rt-durian-sobek', category: 'roti', variant: 'Durian Sobek', price: 90000, note: '' },
  { id: 'rt-durian-sobek-mini', category: 'roti', variant: 'Durian Sobek Mini', price: 50000, note: 'mini' },
];

/** Harga termurah di katalog -> dipakai sebagai asumsi "saran tambah" agar total naik 1 level. */
export const CHEAPEST_PRICE = PRODUCTS.reduce((min, p) => Math.min(min, p.price), Infinity);

export function productsByCategory(categoryId) {
  return PRODUCTS.filter((p) => p.category === categoryId);
}

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? null;
}
