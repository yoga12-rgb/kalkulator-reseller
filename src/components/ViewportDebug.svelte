<script>
  /**
   * Panel diagnostik viewport — hanya muncul kalau URL memuat `?debug=1`.
   *
   * Dipakai untuk masalah layout di iOS: di mode PWA standalone, tinggi `dvh`/`vh`
   * dan nilai `env(safe-area-inset-*)` bisa berbeda dari area yang benar-benar
   * terlihat, sehingga tab bar tampak "mengambang" di atas dasar layar. Panel ini
   * melaporkan angka aslinya dari perangkat. Hapus berkas ini beserta pemakaiannya
   * di `App.svelte` kalau sudah tidak diperlukan.
   */
  let { shell = null, tabbar = null } = $props();

  let baris = $state([]);
  let tersalin = $state(false);
  let dvhProbe = $state(null);
  let vhProbe = $state(null);
  let safeTopProbe = $state(null);
  let safeBottomProbe = $state(null);

  const angka = (nilai) => (Number.isFinite(nilai) ? Math.round(nilai * 10) / 10 : 0);

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
      ['scrollY', `${angka(window.scrollY)}`],
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
</script>

<!-- Probe tak terlihat: pengukuran 100dvh, 100vh, dan safe-area dari dalam halaman. -->
<div class="pointer-events-none fixed top-0 -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
  <div bind:this={dvhProbe} style="height: 100dvh;"></div>
  <div bind:this={vhProbe} style="height: 100vh;"></div>
  <div bind:this={safeTopProbe} style="padding-top: env(safe-area-inset-top);"></div>
  <div bind:this={safeBottomProbe} style="padding-bottom: env(safe-area-inset-bottom);"></div>
</div>

<section
  class="panel-raised fixed right-2 left-2 z-50 rounded-xl border border-gold-500/50 px-3 py-2 text-[11px] text-gold-100 shadow-xl"
  style="top: max(0.5rem, env(safe-area-inset-top)); font-family: var(--font-mono);"
  aria-label="Diagnostik viewport"
>
  <div class="mb-1 flex items-center justify-between gap-2">
    <p class="font-bold tracking-wide uppercase">Diagnostik viewport</p>
    <button class="btn btn-brass px-2 py-1 text-[10px]" onclick={salin}>
      {tersalin ? 'Tersalin' : 'Salin'}
    </button>
  </div>
  {#each baris as [label, nilai]}
    <div class="flex items-baseline justify-between gap-3">
      <span class="text-gold-200/85">{label}</span>
      <span class="font-bold">{nilai}</span>
    </div>
  {/each}
</section>
