<script>
  import Icon from './Icon.svelte';
  import { formatRupiah, formatNumber } from '../lib/pricing.js';

  let {
    open = false,
    totals,
    upgrade = null,
    customer = '',
    note = '',
    onCustomer,
    onNote,
    onClose,
    onSave,
    onShare,
    onCopy,
    onReset,
  } = $props();
</script>

{#if open}
  <div class="fixed inset-0 z-40 flex items-end justify-center">
    <button
      class="absolute inset-0 bg-black/65 backdrop-blur-sm"
      onclick={onClose}
      aria-label="Tutup rincian"
    ></button>

    <div
      class="animate-rise scroll-slim safe-bottom relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-3 panel-raised"
      role="dialog"
      aria-modal="true"
      aria-label="Rincian order"
    >
      <div class="mx-auto mb-2 h-1.5 w-14 rounded-full bg-gold-500/40"></div>

      <div class="flex items-center gap-2">
        <h2 class="emboss flex-1 font-display text-sm font-black tracking-widest text-gold-100 uppercase">
          Rincian Order
        </h2>
        <button class="btn btn-ghost px-2.5 py-2" onclick={onClose} aria-label="Tutup">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div class="mt-2 grid gap-2">
        <label class="block">
          <span class="mb-1 block text-[10px] font-bold tracking-widest text-gold-200/75 uppercase">
            Nama / ID reseller
          </span>
          <input
            class="field"
            type="text"
            placeholder="cth: Bu Rina - Bandung"
            value={customer}
            oninput={(e) => onCustomer(e.currentTarget.value)}
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-[10px] font-bold tracking-widest text-gold-200/75 uppercase">
            Catatan (opsional)
          </span>
          <input
            class="field"
            type="text"
            placeholder="cth: kirim Senin, tanpa box"
            value={note}
            oninput={(e) => onNote(e.currentTarget.value)}
          />
        </label>
      </div>

      <div class="paper receipt-edge mt-3 p-3">
        <p class="text-center font-display text-xs font-black tracking-[0.25em] uppercase">Rajaklana</p>
        <p class="mt-0.5 text-center text-[10px] tracking-wide uppercase opacity-70">
          Abon Gulung &amp; Bolu Susu
        </p>
        <div class="divider-dash my-2"></div>

        <ul class="space-y-1.5">
          {#each totals.lines as line (line.id)}
            <li class="flex items-baseline gap-2 text-[12px]">
              <span class="flex-1 truncate font-bold">{line.variant}</span>
              <span class="font-mono text-[11px] opacity-80">
                {line.qty}×{new Intl.NumberFormat('id-ID').format(line.price)}
              </span>
              <span class="w-20 shrink-0 text-right font-mono font-bold">
                {new Intl.NumberFormat('id-ID').format(line.subtotal)}
              </span>
            </li>
          {/each}
        </ul>

        <div class="divider-dash my-2"></div>

        <div class="flex items-center justify-between text-[12px]">
          <span class="font-bold">Total varian</span>
          <span class="font-mono">{formatNumber(totals.totalQty)} box</span>
        </div>
        <div class="flex items-center justify-between text-[12px]">
          <span class="font-bold">Harga normal</span>
          <span class="font-mono">{formatRupiah(totals.totalNormal)}</span>
        </div>
        <div class="flex items-center justify-between text-[12px]">
          <span class="font-bold">Voucher {totals.discountPercent}%</span>
          <span class="font-mono">-{formatRupiah(totals.discountAmount)}</span>
        </div>

        <div class="divider-dash my-2"></div>

        <div class="flex items-end justify-between">
          <span class="font-display text-xs font-black tracking-widest uppercase">Total Bayar</span>
          <span class="font-mono text-xl font-black">{formatRupiah(totals.totalBayar)}</span>
        </div>

        {#if totals.discountAmount > 0}
          <p class="mt-1 text-right text-[10px] font-bold tracking-wide uppercase opacity-70">
            Hemat {formatRupiah(totals.discountAmount)}
          </p>
        {/if}
      </div>

      {#if upgrade}
        <p class="mt-2 flex items-start gap-1.5 rounded-xl border border-gold-500/25 bg-cocoa-950/50 p-2 text-[11px] text-gold-200/85">
          <Icon name="spark" size={13} class="mt-0.5 flex-none text-gold-300" />
          Tambah {upgrade.addQty} box varian {formatRupiah(upgrade.cheapestPrice)} → langsung diskon
          {upgrade.tier.percent}%.
        </p>
      {/if}

      <div class="safe-bottom mt-3 grid grid-cols-2 gap-2">
        <button class="btn btn-brass col-span-2 py-3" onclick={onSave}>
          <Icon name="check" size={17} stroke={2.6} />
          Simpan ke Riwayat
        </button>
        <button class="btn btn-wood" onclick={onCopy}>
          <Icon name="copy" size={16} />
          Salin Rincian
        </button>
        <button class="btn btn-wood" onclick={onShare}>
          <Icon name="chat" size={16} />
          Kirim WA
        </button>
        <button class="btn btn-danger col-span-2" onclick={onReset}>
          <Icon name="trash" size={16} />
          Reset Kalkulator
        </button>
      </div>
    </div>
  </div>
{/if}
