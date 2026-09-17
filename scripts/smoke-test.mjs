/**
 * Smoke test end-to-end di browser sungguhan (Playwright core + browser lokal).
 *
 *   npm run build
 *   npm run preview            (terminal lain)
 *   node scripts/smoke-test.mjs [url]
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const URL = process.argv[2] ?? 'http://localhost:4173/';

const BROWSERS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const executablePath = BROWSERS.find((candidate) => existsSync(candidate));
if (!executablePath) {
  console.error('Browser Chrome/Edge tidak ditemukan. Pasang Chrome atau Edge lebih dulu.');
  process.exit(2);
}

const results = [];
const errors = [];
function check(label, condition, detail = '') {
  results.push({ label, ok: Boolean(condition) });
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
}

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await context.newPage();

page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

try {
  await page.goto(URL, { waitUntil: 'load' });

  // --- render awal -----------------------------------------------------
  await page.waitForSelector('text=Kalkulator Reseller', { timeout: 15000 });
  check('Judul aplikasi tampil', true);
  check('Manifest PWA tertaut', (await page.locator('link[rel="manifest"]').count()) > 0);

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return response.ok ? response.json() : null;
  });
  check('Manifest bisa dibaca', Boolean(manifest), manifest?.short_name ?? 'null');
  check('Manifest punya 3 ikon', (manifest?.icons ?? []).length >= 3);

  const swScope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active?.scope ?? registration?.scope ?? null;
  });
  check('Service worker terdaftar', Boolean(swScope), swScope ?? 'belum aktif');

  // --- gestur: double tap tidak boleh men-zoom -------------------------
  const touchActions = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).touchAction,
    body: getComputedStyle(document.body).touchAction,
    tombolStepper: getComputedStyle(document.querySelector('.step-btn')).touchAction,
    inputQty: getComputedStyle(document.querySelector('.qty-input')).touchAction,
  }));
  check(
    'Double tap tidak men-zoom (touch-action: manipulation)',
    Object.values(touchActions).every((value) => value === 'manipulation'),
    Object.entries(touchActions)
      .map(([target, value]) => `${target}=${value}`)
      .join(', '),
  );

  // --- app shell: halaman tidak menggulir, hanya panel isi --------------
  const shell = await page.evaluate(() => {
    const html = document.documentElement;
    const main = document.querySelector('main');
    return {
      dokumenBisaScroll: html.scrollHeight > html.clientHeight + 1,
      scrollY: Math.round(window.scrollY),
      tinggiShell: Math.round(document.querySelector('#app > div > div').getBoundingClientRect().height),
      tinggiLayar: html.clientHeight,
      mainOverflowY: getComputedStyle(main).overflowY,
    };
  });
  check(
    'Halaman terkunci, panel isi yang menggulir (tab bar stabil di iOS)',
    !shell.dokumenBisaScroll &&
      shell.scrollY === 0 &&
      shell.mainOverflowY === 'auto' &&
      shell.tinggiShell === shell.tinggiLayar,
    `halaman bisa di-scroll=${shell.dokumenBisaScroll}, scrollY=${shell.scrollY}, tinggi shell=${shell.tinggiShell}px = layar ${shell.tinggiLayar}px, overflow panel=${shell.mainOverflowY}`,
  );

  // --- hitung 6 Sapi Ori + 4 Ayam Ori Mini = 722.000 -> diskon 20% -----
  const plus = (variant) => page.getByLabel(`Tambah ${variant}`, { exact: true });
  for (let i = 0; i < 6; i++) await plus('Sapi Ori').click();
  for (let i = 0; i < 4; i++) await plus('Ayam Ori Mini').click();

  await page.waitForSelector('text=Rp577.600');
  check('Total bayar diskon 20% = Rp577.600', true);

  // --- tab bar: tidak bergeser saat pindah tab --------------------------
  const navNow = () =>
    page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Navigasi utama"]');
      const rect = nav.getBoundingClientRect();
      return {
        top: Math.round(rect.top * 10) / 10,
        tinggi: Math.round(rect.height * 10) / 10,
        posisi: getComputedStyle(nav).position,
        scrollY: Math.round(window.scrollY),
        layar: document.documentElement.clientHeight,
      };
    });

  const navHasil = [];
  for (const nama of ['Voucher', /^Riwayat/, 'Hitung']) {
    await page.getByRole('button', { name: nama, exact: true }).click();
    await page.waitForTimeout(150);
    navHasil.push(await navNow());
  }
  await page.waitForTimeout(100);
  const navKembali = await navNow();
  const navSama = [...navHasil, navKembali].every(
    (item) => item.top === navHasil[0].top && item.tinggi === navHasil[0].tinggi,
  );
  const navRapi = navKembali.top + navKembali.tinggi <= navKembali.layar + 1 && navKembali.top >= navKembali.layar - 140;
  check(
    'Tab bar tidak bergeser saat pindah tab',
    navSama && navRapi && navHasil.every((item) => item.scrollY === 0),
    `posisi tab bar tiap tab: ${navHasil.map((item) => `y=${item.top}/${item.tinggi}px`).join(', ')} (${navKembali.posisi}), batas bawah layar=${navKembali.layar}px`,
  );

  // --- tab baru selalu mulai dari atas ----------------------------------
  const scrollDalam = () =>
    page.evaluate(() => Math.round(document.querySelector('main').scrollTop));
  await page.evaluate(() => {
    const main = document.querySelector('main');
    main.scrollTo({ top: main.scrollHeight });
  });
  await page.waitForTimeout(150);
  const scrollBawah = await scrollDalam();
  await page.getByRole('button', { name: 'Voucher', exact: true }).click();
  await page.waitForTimeout(150);
  const scrollVoucher = await scrollDalam();
  await page.getByRole('button', { name: 'Hitung', exact: true }).click();
  await page.waitForTimeout(150);
  const scrollHitung = await scrollDalam();
  check(
    'Tab baru selalu terbuka dari atas',
    scrollBawah > 0 && scrollVoucher === 0 && scrollHitung === 0,
    `panel isi: bawah=${scrollBawah}px, setelah ke Voucher=${scrollVoucher}px, kembali ke Hitung=${scrollHitung}px`,
  );

  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('rajaklana.draft.v1') ?? '{}'));
  check(
    'Draft qty tersimpan di localStorage',
    draft.qty?.['fr-sapi-ori'] === 6 && draft.qty?.['fr-ayam-ori-mini'] === 4,
  );

  await page.getByLabel('Kurangi Sapi Ori', { exact: true }).click();
  check(
    'Tombol minus mengurangi qty',
    (await page.getByLabel('Jumlah Sapi Ori', { exact: true }).inputValue()) === '5',
  );
  await plus('Sapi Ori').click();

  // input manual: 6 Sapi Ori + 9 Ayam Ori Mini = 957.000 -> diskon 20%
  await page.getByLabel('Jumlah Ayam Ori Mini', { exact: true }).fill('9');
  await page.waitForSelector('text=Rp765.600');
  check('Input manual mengubah total (Rp957.000 - 20% = Rp765.600)', true);
  await page.getByLabel('Jumlah Ayam Ori Mini', { exact: true }).fill('4');
  await page.waitForSelector('text=Rp577.600');

  // --- sheet rincian + simpan -----------------------------------------
  await page.getByLabel('Lihat rincian order').click();
  await page.waitForSelector('text=Rincian Order');
  check('Sheet rincian terbuka', true);

  // --- scrollbar disembunyikan -----------------------------------------
  const bars = await page.evaluate(() => {
    const html = document.documentElement;
    const panel = document.querySelector('.scroll-hide');
    const main = document.querySelector('main');
    return {
      htmlCss: getComputedStyle(html).scrollbarWidth,
      bodyCss: getComputedStyle(document.body).scrollbarWidth,
      gutter: window.innerWidth - html.clientWidth,
      mainCss: getComputedStyle(main).scrollbarWidth,
      mainBisaScroll: main.scrollHeight > main.clientHeight,
      panelCss: panel ? getComputedStyle(panel).scrollbarWidth : null,
    };
  });
  check(
    'Scrollbar disembunyikan (scroll tetap jalan)',
    bars.htmlCss === 'none' &&
      bars.bodyCss === 'none' &&
      bars.gutter === 0 &&
      bars.mainCss === 'none' &&
      bars.mainBisaScroll &&
      bars.panelCss === 'none',
    `html=${bars.htmlCss}, body=${bars.bodyCss}, batang halaman=${bars.gutter}px, panel isi bisa di-scroll=${bars.mainBisaScroll}, panel rincian=${bars.panelCss}`,
  );

  await page.getByPlaceholder('cth: Bu Rina - Bandung').fill('Bu Rina - Bandung');
  await page.getByRole('button', { name: /Simpan ke Riwayat/ }).click();
  await page.waitForSelector('text=Order tersimpan di riwayat');
  check('Order tersimpan + toast muncul', true);

  const [headerBox, toastBox] = await Promise.all([
    page.locator('header').boundingBox(),
    page.getByRole('status').boundingBox(),
  ]);
  check(
    'Toast muncul di bawah header (tidak menutupi judul)',
    Boolean(headerBox && toastBox) && toastBox.y >= headerBox.y + headerBox.height,
    toastBox && headerBox ? `toast y=${Math.round(toastBox.y)}, header bawah=${Math.round(headerBox.y + headerBox.height)}` : 'tidak terukur',
  );

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('rajaklana.history.v1') ?? '[]'));
  check(
    'Riwayat tersimpan di localStorage',
    stored.length === 1 && stored[0].totalBayar === 577600,
    String(stored[0]?.totalBayar),
  );

  // --- tab voucher -----------------------------------------------------
  await page.getByRole('button', { name: 'Voucher', exact: true }).click();
  await page.waitForSelector('text=Voucher Reseller');
  check('Tab voucher menampilkan 4 tier diskon', (await page.locator('.tier-card').count()) === 4);
  check('Tier 20% ditandai aktif', (await page.locator('.tier-card-on').count()) === 1);
  await page.screenshot({ path: resolve(ROOT, 'tmp/smoke-voucher.png') });

  // --- tab riwayat -----------------------------------------------------
  await page.getByRole('button', { name: /^Riwayat/ }).click();
  await page.waitForSelector('text=Bu Rina - Bandung');
  check('Order muncul di tab riwayat', true);
  await page.getByRole('button', { name: /^Detail$/ }).first().click();
  await page.waitForSelector('text=6 box');
  check('Detail order bisa dibuka', true);

  // --- persistensi setelah reload -------------------------------------
  await page.reload({ waitUntil: 'load' });
  await page.getByRole('button', { name: /^Riwayat/ }).click();
  await page.waitForSelector('text=Bu Rina - Bandung');
  check('Riwayat tetap ada setelah reload', true);

  mkdirSync(resolve(ROOT, 'tmp'), { recursive: true });
  await page.screenshot({ path: resolve(ROOT, 'tmp/smoke-riwayat.png') });
  await page.getByRole('button', { name: 'Hitung', exact: true }).click();
  await page.waitForSelector('text=Rp577.600');
  await page.screenshot({ path: resolve(ROOT, 'tmp/smoke-kalkulator.png') });

  // --- kredit developer ------------------------------------------------
  await page.evaluate(() => {
    const main = document.querySelector('main');
    main.scrollTo({ top: main.scrollHeight });
  });
  await page.waitForTimeout(150);

  const credit = page.locator('footer a[href="https://www.instagram.com/mang.agooy/"]');
  const creditFound = (await credit.count()) === 1;
  const creditBox = creditFound ? await credit.first().boundingBox() : null;
  const creditText = creditFound ? (await credit.first().innerText()).replace(/\s+/g, ' ').trim() : '';
  const viewportHeight = page.viewportSize()?.height ?? 0;
  const barTotalBox = await page.getByRole('button', { name: /Lihat rincian order/ }).boundingBox();

  check(
    'Kredit developer "Yoga Septriana" + link Instagram tampil utuh',
    Boolean(creditBox) &&
      creditText.includes('Yoga Septriana') &&
      creditBox.y + creditBox.height <= viewportHeight &&
      (!barTotalBox || creditBox.y + creditBox.height <= barTotalBox.y),
    creditBox
      ? `${creditText} @ y=${Math.round(creditBox.y)}, tinggi viewport=${viewportHeight}, bar total mulai y=${
          barTotalBox ? Math.round(barTotalBox.y) : 'tidak tampil'
        }`
      : 'link tidak ditemukan',
  );
  await page.screenshot({ path: resolve(ROOT, 'tmp/smoke-kredit.png') });

  console.log(
    'Screenshot: tmp/smoke-kalkulator.png, tmp/smoke-kredit.png, tmp/smoke-riwayat.png, tmp/smoke-voucher.png',
  );
} finally {
  await browser.close();
}

if (errors.length) {
  console.log('\nError di console browser:');
  for (const error of errors) console.log(` - ${error}`);
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} pemeriksaan lulus, ${errors.length} error console.`);
process.exit(failed.length || errors.length ? 1 : 0);
