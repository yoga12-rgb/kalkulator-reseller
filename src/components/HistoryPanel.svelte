<script>
  import Icon from './Icon.svelte';
  import { formatRupiah, formatNumber } from '../lib/pricing.js';
  import { formatDayLabel, formatClock } from '../lib/storage.js';

  let {
    history = [],
    onLoad,
    onCopy,
    onShare,
    onDelete,
    onClear,
    onExport,
    onImport,
  } = $props();

  let query = $state('');
  let expandedId = $state(null);
  let confirmDeleteId = $state(null);
  let confirmClear = $state(false);
  let fileInput = $state(null);

  const filtered = $derived(
    query.trim()
      ? history.filter((order) => {
          const q = query.trim().toLowerCase();
          return (
            order.customer.toLowerCase().includes(q) ||
            order.lines.some((line) => line.variant.toLowerCase().includes(q))
          );
        })
      : history,
  );

  const totalOmzet = $derived(history.reduce((sum, o) => sum + o.totalBayar, 0));
  const totalPcs = $derived(history.reduce((sum, o) => sum + o.totalQty, 0));
  const totalHemat = $derived(history.reduce((sum, o) => sum + o.discountAmount, 0));

  /** Kelompokkan per hari supaya mirip buku catatan. */
  const grouped = $derived.by(() => {
    const map = new Map();
    for (const order of filtered) {
      const key = formatDayLabel(order.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(order);
    }
    return [...map.entries()].map(([day, orders]) => ({ day, orders }));
  });

  async function handleFile(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const text = await file.text();
    onImport?.(text);
  }
</script>

<div class="space-y-3">
  <section class="panel-raised p-3">
    <div class="flex items-center gap-2">
      <span class="plate-gold grid h-10 w-10 flex-none place-items-center">
        <Icon name="history" size={20} />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="emboss font-display text-sm font-black tracking-widest text-gold-100 uppercase">
          Riwayat Order
        </h2>
        <p class="text-[11px] text-gold-200/70">Tersimpan di perangkat ini (localStorage)</p>
      </div>
      <span class="badge-count">{history.length}</span>
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2 text-center">
      <div class="panel-inset rounded-xl px-2 py-2">
        <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Order</p>
        <p class="font-mono text-sm font-bold text-gold-100">{formatNumber(history.length)}</p>
      </div>
      <div class="panel-inset rounded-xl px-2 py-2">
        <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Total pcs</p>
        <p class="font-mono text-sm font-bold text-gold-100">{formatNumber(totalPcs)}</p>
      </div>
      <div class="panel-inset rounded-xl px-2 py-2">
        <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Omzet</p>
        <p class="font-mono text-sm font-bold text-gold-100">{formatRupiah(totalOmzet)}</p>
      </div>
    </div>

    {#if totalHemat > 0}
      <p class="mt-2 rounded-xl border border-gold-500/25 bg-cocoa-950/45 px-3 py-1.5 text-[11px] text-gold-200/85">
        Total diskon yang sudah didapat:
        <span class="font-mono font-bold text-gold-100">{formatRupiah(totalHemat)}</span>
      </p>
    {/if}

    <div class="mt-3 grid grid-cols-3 gap-2">
      <button class="btn btn-wood" onclick={onExport} disabled={!history.length}>
        <Icon name="download" size={15} />
        Ekspor
      </button>
      <button class="btn btn-wood" onclick={() => fileInput?.click()}>
        <Icon name="upload" size={15} />
        Impor
      </button>
      <button
        class="btn btn-danger"
        disabled={!history.length}
        onclick={() => {
          if (confirmClear) {
            confirmClear = false;
            onClear?.();
          } else {
            confirmClear = true;
          }
        }}
      >
        <Icon name="trash" size={15} />
        {confirmClear ? 'Yakin?' : 'Hapus'}
      </button>
    </div>

    <input class="hidden" type="file" accept="application/json,.json" bind:this={fileInput} onchange={handleFile} />

    {#if history.length}
      <input class="field mt-2" type="search" placeholder="Cari nama reseller / varian…" bind:value={query} />
    {/if}
  </section>

  {#if !history.length}
    <div class="panel flex flex-col items-center gap-2 p-6 text-center">
      <Icon name="basket" size={30} class="text-gold-300/70" />
      <p class="text-sm font-bold text-gold-100">Belum ada order tersimpan</p>
      <p class="text-[11px] text-gold-200/70">
        Isi jumlah varian di tab Kalkulator, lalu tekan pelat emas di bawah untuk melihat rincian dan menyimpan order.
      </p>
    </div>
  {:else if !filtered.length}
    <div class="panel p-4 text-center text-sm text-gold-200/80">Tidak ada order yang cocok dengan “{query}”.</div>
  {:else}
    {#each grouped as group (group.day)}
      <div class="space-y-2">
        <p class="px-1 text-[10px] font-bold tracking-[0.2em] text-gold-200/60 uppercase">{group.day}</p>

        {#each group.orders as order (order.id)}
          {@const isOpen = expandedId === order.id}
          <article class="paper overflow-hidden">
            <div class="flex items-start gap-2 p-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">{order.customer?.trim() || 'Tanpa nama'}</p>
                <p class="font-mono text-[11px] opacity-70">
                  {formatClock(order.createdAt)} · {order.totalQty} pcs · normal {formatRupiah(order.totalNormal)}
                </p>
                {#if order.note}
                  <p class="mt-1 text-[11px] italic opacity-75">“{order.note}”</p>
                {/if}
              </div>
              <div class="flex-none text-right">
                <p class="font-mono text-base font-black">{formatRupiah(order.totalBayar)}</p>
                <span class="chip {order.discountPercent >= 25 ? 'chip-red' : 'chip-gold'}">
                  -{order.discountPercent}%
                </span>
              </div>
            </div>

            {#if isOpen}
              <div class="divider-dash mx-3"></div>
              <ul class="space-y-1 px-3 pt-2">
                {#each order.lines as line (line.id)}
                  <li class="flex items-baseline gap-2 text-[12px]">
                    <span class="flex-1 truncate font-bold">{line.variant}</span>
                    <span class="font-mono opacity-75">{line.qty} pcs</span>
                    <span class="w-20 shrink-0 text-right font-mono font-bold">{formatRupiah(line.subtotal)}</span>
                  </li>
                {/each}
              </ul>
              <p class="px-3 pt-2 text-right font-mono text-[11px] opacity-80">
                Diskon {order.discountPercent}% = {formatRupiah(order.discountAmount)}
              </p>
            {/if}

            <div class="grid grid-cols-3 gap-1.5 p-3 pt-2">
              <button
                class="btn btn-wood px-2 py-2 text-[11px]"
                onclick={() => (expandedId = isOpen ? null : order.id)}
              >
                <Icon name={isOpen ? 'chevron' : 'receipt'} size={14} />
                {isOpen ? 'Tutup' : 'Detail'}
              </button>
              <button class="btn btn-brass px-2 py-2 text-[11px]" onclick={() => onLoad?.(order)}>
                <Icon name="calculator" size={14} />
                Pakai
              </button>
              <button
                class="btn px-2 py-2 text-[11px] {confirmDeleteId === order.id ? 'btn-danger' : 'btn-ghost'}"
                onclick={() => {
                  if (confirmDeleteId === order.id) {
                    confirmDeleteId = null;
                    onDelete?.(order.id);
                  } else {
                    confirmDeleteId = order.id;
                  }
                }}
              >
                <Icon name="trash" size={14} />
                {confirmDeleteId === order.id ? 'Yakin?' : 'Hapus'}
              </button>
              <button class="btn btn-ghost col-span-2 px-2 py-2 text-[11px]" onclick={() => onCopy?.(order)}>
                <Icon name="copy" size={14} />
                Salin rincian
              </button>
              <button class="btn btn-ghost px-2 py-2 text-[11px]" onclick={() => onShare?.(order)}>
                <Icon name="chat" size={14} />
                WA
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/each}
  {/if}
</div>
