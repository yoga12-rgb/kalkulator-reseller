<script>
  import { CATEGORIES, PRODUCTS } from './lib/catalog.js';
  import {
    TIERS,
    computeTotals,
    suggestUpgrade,
    buildOrderText,
    normalizeQty,
    formatNumber,
  } from './lib/pricing.js';
  import * as store from './lib/storage.js';
  import AppHeader from './components/AppHeader.svelte';
  import CategoryCard from './components/CategoryCard.svelte';
  import VoucherTiers from './components/VoucherTiers.svelte';
  import SummaryBar from './components/SummaryBar.svelte';
  import SummarySheet from './components/SummarySheet.svelte';
  import HistoryPanel from './components/HistoryPanel.svelte';
  import Toast from './components/Toast.svelte';
  import Icon from './components/Icon.svelte';

  const draft = store.loadDraft();

  let tab = $state('hitung');
  let qtyMap = $state({ ...draft.qty });
  let customer = $state(draft.customer);
  let note = $state(draft.note);
  let search = $state('');
  let history = $state(store.loadHistory());
  let sheetOpen = $state(false);
  let toast = $state(null);
  let toastTimer = null;
  let installEvent = $state(null);
  let updateAvailable = $state(false);
  let openCats = $state({ 'floss-roll': true, 'bolu-susu': false, roti: false });

  const totals = $derived(computeTotals(qtyMap));
  const upgrade = $derived(suggestUpgrade(qtyMap));
  const isSearching = $derived(search.trim().length > 0);

  /** Daftar kategori + varian, difilter oleh kotak pencarian. */
  const groups = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return CATEGORIES.map((category) => {
      const all = PRODUCTS.filter((p) => p.category === category.id);
      const items = q
        ? all.filter((p) => p.variant.toLowerCase().includes(q) || category.name.toLowerCase().includes(q))
        : all;
      return { category, items };
    }).filter((group) => group.items.length > 0);
  });

  /** Draft otomatis tersimpan, jadi input tidak hilang saat aplikasi ditutup. */
  $effect(() => {
    store.saveDraft({ qty: qtyMap, customer, note });
  });

  function notify(message, tone = 'info') {
    toast = { message, tone };
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast = null;
    }, 2800);
  }

  function setQty(id, value) {
    const n = normalizeQty(value);
    if (n === 0) {
      const next = { ...qtyMap };
      delete next[id];
      qtyMap = next;
      return;
    }
    qtyMap = { ...qtyMap, [id]: n };
  }

  function toggleCategory(id) {
    openCats = { ...openCats, [id]: !openCats[id] };
  }

  function resetAll() {
    qtyMap = {};
    customer = '';
    note = '';
    sheetOpen = false;
    notify('Kalkulator direset');
  }

  function snapshot() {
    const createdAt = new Date().toISOString();
    return {
      id: `ord-${Date.now()}`,
      createdAt,
      dateLabel: store.formatDateLabel(createdAt),
      customer,
      note,
      lines: totals.lines,
      totalQty: totals.totalQty,
      totalNormal: totals.totalNormal,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      totalBayar: totals.totalBayar,
    };
  }

  function saveOrder() {
    if (totals.isEmpty) {
      notify('Isi jumlah varian dulu ya', 'error');
      return;
    }
    history = store.addOrder(history, snapshot());
    sheetOpen = false;
    notify('Order tersimpan di riwayat', 'success');
  }

  function loadOrder(order) {
    const next = {};
    for (const line of order.lines) next[line.id] = line.qty;
    qtyMap = next;
    customer = order.customer ?? '';
    note = order.note ?? '';
    tab = 'hitung';
    notify('Order dimuat ke kalkulator', 'success');
  }

  function deleteOrder(id) {
    history = store.removeOrder(history, id);
    notify('Order dihapus');
  }

  function clearAllHistory() {
    history = store.clearHistory();
    notify('Semua riwayat dihapus');
  }

  async function copyText(text, message) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      notify(message, 'success');
    } catch {
      notify('Gagal menyalin, coba lagi', 'error');
    }
  }

  function shareWhatsApp(text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  function exportHistory() {
    if (!history.length) return;
    const blob = new Blob([store.exportHistoryText(history)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat-reseller-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify('File riwayat diunduh', 'success');
  }

  function importHistory(text) {
    const result = store.importHistoryText(history, text);
    history = result.list;
    notify(result.message, result.ok ? 'success' : 'error');
  }

  async function installApp() {
    if (!installEvent) return;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice?.outcome === 'accepted') {
      installEvent = null;
    } else {
      notify('Pemasangan dibatalkan');
    }
  }

  /** Listener PWA (install prompt + info versi baru/offline). */
  $effect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      installEvent = event;
    };
    const onInstalled = () => {
      installEvent = null;
      notify('Aplikasi dipasang di layar utama', 'success');
    };
    const onUpdate = () => {
      updateAvailable = true;
    };
    const onOffline = () => notify('Siap dipakai offline', 'success');

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('app:update-available', onUpdate);
    window.addEventListener('app:offline-ready', onOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('app:update-available', onUpdate);
      window.removeEventListener('app:offline-ready', onOffline);
    };
  });
</script>

<div class="flex min-h-full justify-center">
  <div class="relative flex w-full max-w-md flex-col">
    <AppHeader
      installable={!!installEvent}
      onInstall={installApp}
      {updateAvailable}
      onReload={() => window.location.reload()}
    />

    <main class="safe-x flex-1 space-y-3 px-3 pt-3 pb-40">
      {#if tab === 'hitung'}
        <!-- Panel pencarian + status cepat -->
        <section class="panel-raised p-3">
          <div class="flex items-center gap-2">
            <span class="plate-gold grid h-10 w-10 flex-none place-items-center">
              <Icon name="calculator" size={20} />
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="emboss font-display text-sm font-black tracking-widest text-gold-100 uppercase">
                Input Varian
              </h2>
              <p class="text-[11px] text-gold-200/70">Masukkan jumlah pcs per varian</p>
            </div>
            {#if !totals.isEmpty}
              <button class="btn btn-ghost px-2.5 py-2" onclick={resetAll} title="Reset kalkulator">
                <Icon name="refresh" size={15} />
              </button>
            {/if}
          </div>

          <input class="field mt-3" type="search" placeholder="Cari varian…" bind:value={search} />

          {#if totals.isEmpty}
            <p class="mt-2 flex items-start gap-1.5 text-[11px] text-gold-200/75">
              <Icon name="info" size={13} class="mt-0.5 flex-none text-gold-300" />
              Belum ada varian yang diisi. Tekan tombol <span class="font-bold">+</span> pada varian untuk mulai menghitung.
            </p>
          {:else}
            <div class="mt-3 grid grid-cols-3 gap-2 text-center">
              <div class="panel-inset rounded-xl px-2 py-2">
                <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Varian</p>
                <p class="font-mono text-sm font-bold text-gold-100">{totals.lines.length}</p>
              </div>
              <div class="panel-inset rounded-xl px-2 py-2">
                <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Total pcs</p>
                <p class="font-mono text-sm font-bold text-gold-100">{formatNumber(totals.totalQty)}</p>
              </div>
              <div class="panel-inset rounded-xl px-2 py-2">
                <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Diskon</p>
                <p class="font-mono text-sm font-bold text-gold-100">{totals.discountPercent}%</p>
              </div>
            </div>
          {/if}
        </section>

        {#each groups as group (group.category.id)}
          <CategoryCard
            category={group.category}
            items={group.items}
            {qtyMap}
            open={isSearching || openCats[group.category.id]}
            onToggle={() => toggleCategory(group.category.id)}
            onQty={setQty}
          />
        {/each}

        {#if !groups.length}
          <div class="panel p-4 text-center text-sm text-gold-200/80">
            Tidak ada varian yang cocok dengan “{search}”.
          </div>
        {/if}

        <button class="btn btn-ghost w-full py-3" onclick={() => (tab = 'voucher')}>
          <Icon name="tag" size={16} />
          Lihat ketentuan voucher &amp; diskon
        </button>
      {:else if tab === 'voucher'}
        <VoucherTiers tiers={TIERS} {totals} {upgrade} />
        {#if !totals.isEmpty}
          <button class="btn btn-brass w-full py-3" onclick={() => (sheetOpen = true)}>
            <Icon name="receipt" size={16} />
            Lihat rincian order
          </button>
        {/if}
      {:else}
        <HistoryPanel
          {history}
          onLoad={loadOrder}
          onCopy={(order) => copyText(buildOrderText(order), 'Rincian disalin')}
          onShare={(order) => shareWhatsApp(buildOrderText(order))}
          onDelete={deleteOrder}
          onClear={clearAllHistory}
          onExport={exportHistory}
          onImport={importHistory}
        />
      {/if}
    </main>

    {#if tab === 'hitung' && !totals.isEmpty}
      <SummaryBar {totals} onOpen={() => (sheetOpen = true)} />
    {/if}

    <nav
      class="tabbar safe-bottom fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 items-stretch gap-1 px-2 pt-1"
      aria-label="Navigasi utama"
    >
      <button
        class="tab-btn"
        class:tab-btn-on={tab === 'hitung'}
        onclick={() => (tab = 'hitung')}
        aria-label="Hitung"
        aria-current={tab === 'hitung'}
      >
        <Icon name="calculator" size={22} />
        Hitung
      </button>
      <button
        class="tab-btn"
        class:tab-btn-on={tab === 'voucher'}
        onclick={() => (tab = 'voucher')}
        aria-label="Voucher"
        aria-current={tab === 'voucher'}
      >
        <Icon name="tag" size={22} />
        Voucher
      </button>
      <button
        class="tab-btn"
        class:tab-btn-on={tab === 'riwayat'}
        onclick={() => (tab = 'riwayat')}
        aria-label={history.length ? `Riwayat, ${history.length} order` : 'Riwayat'}
        aria-current={tab === 'riwayat'}
      >
        <span class="relative">
          <Icon name="history" size={22} />
          {#if history.length}
            <span class="badge-count absolute -top-1.5 -right-3 text-[10px]">{history.length}</span>
          {/if}
        </span>
        Riwayat
      </button>
    </nav>

    <SummarySheet
      open={sheetOpen}
      {totals}
      {upgrade}
      {customer}
      {note}
      onCustomer={(value) => (customer = value)}
      onNote={(value) => (note = value)}
      onClose={() => (sheetOpen = false)}
      onSave={saveOrder}
      onCopy={() => copyText(buildOrderText(snapshot()), 'Rincian disalin')}
      onShare={() => shareWhatsApp(buildOrderText(snapshot()))}
      onReset={resetAll}
    />

    <Toast message={toast?.message} tone={toast?.tone} />
  </div>
</div>

