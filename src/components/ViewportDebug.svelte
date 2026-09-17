<script>
  /**
   * Panel diagnostik viewport — muncul kalau URL memuat `?debug=1`, atau menyala
   * sendiri ketika layout terukur meleset dari layar (lihat `selisihViewport` di
   * `App.svelte`).
   *
   * Dipakai untuk masalah layout di iOS: di mode PWA standalone, tinggi `dvh`/`vh`
   * dan nilai `env(safe-area-inset-*)` bisa berbeda dari area yang benar-benar
   * terlihat, sehingga tab bar tampak "mengambang" di atas dasar layar. Panel ini
   * melaporkan angka aslinya dari perangkat. Tombol **Uji kanvas** mengecat kanvas
   * halaman magenta: kalau pita di bawah tab bar ikut jadi magenta, pita itu memang
   * bagian kanvas halaman; kalau tidak, pita itu dilukis di luar halaman (sistem).
   * Hapus berkas ini beserta pemakaiannya di `App.svelte` kalau sudah tidak
   * diperlukan.
   */
  let { shell = null, tabbar = null, onClose = null } = $props();

  let baris = $state([]);
  let tersalin = $state(false);
  let ujiKanvas = $state(false);
  let warnaUji = $state('#1c0e07');
  let dvhProbe = $state(null);
  let vhProbe = $state(null);
  let safeTopProbe = $state(null);
  let safeBottomProbe = $state(null);

  const angka = (nilai) => (Number.isFinite(nilai) ? Math.round(nilai * 10) / 10 : 0);

  /**
   * Mengecat kanvas `html` magenta supaya ketahuan siapa yang melukis pita di
   * bawah tab bar: kalau pitanya ikut magenta, itu kanvas halaman (dan perbaikan
   * warna kanvas berlaku); kalau tetap gelap, pita itu dilukis sistem di luar
   * halaman sehingga hanya `background_color` manifest yang bisa menyamakannya.
   */
  function toggleKanvas() {
    ujiKanvas = !ujiKanvas;
    document.documentElement.style.backgroundColor = ujiKanvas ? '#ff00ff' : '';
    document.documentElement.style.backgroundImage = ujiKanvas ? 'none' : '';
    ukur();
  }

  /**
   * Baris pembanding warna untuk pita di dasar layar. Pita itu dilukis **sistem, di
   * luar halaman** (terbukti di perangkat: kanvas magenta tidak mengubah pitanya),
   * jadi warnanya tidak bisa diwarnai dari CSS. Yang bisa dilakukan: menyetel
   * `--warna-tepi` sementara (kanvas `html` + bibir bawah tab bar ikut berubah) lalu
   * dicari nilai yang membuat **batas** antara tab bar dan pita itu hilang.
   */
  const WARNA_UJI = [
    { nama: '1', hex: '#000000' },
    { nama: '2', hex: '#120806' },
    { nama: '3', hex: '#160b06' },
    { nama: '4', hex: '#1c0e07' },
    { nama: '5', hex: '#24120b' },
    { nama: '6', hex: '#2c170e' },
    { nama: '7', hex: '#3d2114' },
  ];

  /** Setel `--warna-tepi` sementara supaya bisa dibandingkan langsung di perangkat. */
  function pilihWarna(hex) {
    warnaUji = hex;
    document.documentElement.style.setProperty('--warna-tepi', hex);
    ukur();
  }

  function ukur() {
    const html = document.documentElement;
    const vv = window.visualViewport;
    const kotakShell = shell?.getBoundingClientRect();
    const kotakTabbar = tabbar?.getBoundingClientRect();
    const safeTop = safeTopProbe ? parseFloat(getComputedStyle(safeTopProbe).paddingTop) : 0;
    const safeBottom = safeBottomProbe ? parseFloat(getComputedStyle(safeBottomProbe).paddingBottom) : 0;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

    baris = [
      ['mode', standalone ? 'standalone (PWA)' : 'browser'],
      ['layar (screen)', `${angka(window.screen.width)} x ${angka(window.screen.height)}`],
      ['innerHeight', `${angka(window.innerHeight)}`],
      ['html.clientHeight', `${angka(html.clientHeight)}`],
      ['visualViewport', vv ? `${angka(vv.height)} (top ${angka(vv.offsetTop)})` : 'tidak ada'],
      [
        '100dvh / 100vh',
        `${angka(dvhProbe?.getBoundingClientRect().height ?? 0)} / ${angka(vhProbe?.getBoundingClientRect().height ?? 0)}`,
      ],
      ['safe-area atas / bawah', `${angka(safeTop)} / ${angka(safeBottom)}`],
      ['shell', `${angka(kotakShell?.top)} → ${angka(kotakShell?.bottom)} (t ${angka(kotakShell?.height)})`],
      ['tab bar', `${angka(kotakTabbar?.top)} → ${angka(kotakTabbar?.bottom)} (t ${angka(kotakTabbar?.height)})`],
      ['jarak tab bar → dasar layar', `${angka(window.innerHeight - (kotakTabbar?.bottom ?? 0))}`],
      ['jarak tab bar → dasar html', `${angka(html.clientHeight - (kotakTabbar?.bottom ?? 0))}`],
      ['jarak ke visualViewport', `${angka(window.innerHeight - (vv ? vv.height + vv.offsetTop : window.innerHeight))}`],
      ['selisih layar - innerHeight', `${angka(window.screen.height - window.innerHeight)}`],
      ['scrollY', `${angka(window.scrollY)}`],
      ['kanvas html', getComputedStyle(html).backgroundColor],
      ['warna tepi (--warna-tepi)', warnaUji],
    ];
  }

  $effect(() => {
    // Dibaca supaya pengukuran ikut jalan begitu elemen shell/tab bar terpasang.
    void shell;
    void tabbar;
    ukur();

    const ulang = () => ukur();
    window.addEventListener('resize', ulang);
    window.addEventListener('orientationchange', ulang);
    window.addEventListener('scroll', ulang, { passive: true });
    window.visualViewport?.addEventListener('resize', ulang);
    window.visualViewport?.addEventListener('scroll', ulang);
    const jam = setInterval(ulang, 1000);

    return () => {
      window.removeEventListener('resize', ulang);
      window.removeEventListener('orientationchange', ulang);
      window.removeEventListener('scroll', ulang);
      window.visualViewport?.removeEventListener('resize', ulang);
      window.visualViewport?.removeEventListener('scroll', ulang);
      clearInterval(jam);
    };
  });

  async function salin() {
    const teks = baris.map(([label, nilai]) => `${label}: ${nilai}`).join('\n');
    try {
      await navigator.clipboard.writeText(teks);
      tersalin = true;
      setTimeout(() => (tersalin = false), 1500);
    } catch {
      tersalin = false;
    }
  }
  /** Cat kanvas dari tombol "Uji kanvas" + warna uji dibersihkan saat panel ditutup. */
  $effect(() => () => {
    document.documentElement.style.backgroundColor = '';
    document.documentElement.style.backgroundImage = '';
    document.documentElement.style.removeProperty('--warna-tepi');
  });
</script>

<!-- Probe tak terlihat: pengukuran 100dvh, 100vh, dan safe-area dari dalam halaman. -->
<div class="pointer-events-none fixed top-0 -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
  <div bind:this={dvhProbe} style="height: 100dvh;"></div>
  <div bind:this={vhProbe} style="height: 100vh;"></div>
  <div bind:this={safeTopProbe} style="padding-top: env(safe-area-inset-top);"></div>
  <div bind:this={safeBottomProbe} style="padding-bottom: env(safe-area-inset-bottom);"></div>
</div>

<!-- Pembanding warna pita bawah: duduk tepat di atas tab bar supaya bisa dibandingkan
     langsung dengan pita yang dilukis sistem di dasar layar. Ketuk salah satu baris →
     `--warna-tepi` (kanvas `html` + bibir bawah tab bar) ikut berubah; nomor yang
     membuat batas antara tab bar dan pita itu hilang adalah warna pita yang asli. -->
<div
  class="fixed inset-x-0 z-40"
  style="bottom: calc(7.5rem + env(safe-area-inset-bottom));"
  aria-label="Pembanding warna tepi bawah"
>
  {#each WARNA_UJI as warna}
    <button
      type="button"
      class="flex h-5 w-full items-center justify-between px-3 text-left"
      style="background: {warna.hex};"
      aria-pressed={warnaUji === warna.hex}
      aria-label={`warna ${warna.nama} ${warna.hex}`}
      onclick={() => pilihWarna(warna.hex)}
    >
      <span class="text-[9px] font-bold" style="color: rgba(255, 248, 220, 0.95);">
        {warnaUji === warna.hex ? '●' : ''}{warna.nama}
      </span>
      <span class="text-[9px]" style="color: rgba(255, 248, 220, 0.5);">{warna.hex}</span>
    </button>
  {/each}
</div>

<section
  class="panel-raised fixed right-2 left-2 z-50 rounded-xl border border-gold-500/50 px-3 py-2 text-[11px] text-gold-100 shadow-xl"
  style="top: max(0.5rem, env(safe-area-inset-top)); font-family: var(--font-mono);"
  aria-label="Diagnostik viewport"
>
  <div class="mb-1 flex items-center justify-between gap-2">
    <p class="font-bold tracking-wide uppercase">Diagnostik viewport</p>
    <div class="flex items-center gap-1.5">
      <button class="btn btn-brass px-2 py-1 text-[10px]" onclick={salin}>
        {tersalin ? 'Tersalin' : 'Salin'}
      </button>
      <button class="btn btn-ghost px-2 py-1 text-[10px]" onclick={toggleKanvas}>
        {ujiKanvas ? 'Kanvas normal' : 'Uji kanvas'}
      </button>
      {#if onClose}
        <button class="btn btn-ghost px-2 py-1 text-[10px]" onclick={onClose}>Tutup</button>
      {/if}
    </div>
  </div>
  {#each baris as [label, nilai]}
    <div class="flex items-baseline justify-between gap-3">
      <span class="text-gold-200/85">{label}</span>
      <span class="font-bold">{nilai}</span>
    </div>
  {/each}
  <p class="mt-1 text-[9px] leading-snug text-gold-200/70">
    Ketuk baris warna di atas tab bar sampai batas antara tab bar dan pita di dasar layar hilang,
    lalu sebut nomornya.
  </p>
</section>
