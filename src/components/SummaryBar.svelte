<script>
  import Icon from './Icon.svelte';
  import { formatRupiah } from '../lib/pricing.js';

  let { totals, onOpen } = $props();
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3">
  <button
    class="plate-gold pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left tap-none"
    onclick={onOpen}
    aria-label="Lihat rincian order"
  >
    <span class="grid h-10 w-10 flex-none place-items-center rounded-xl bg-cocoa-900/85 text-gold-200">
      <Icon name="receipt" size={20} />
    </span>

    <span class="min-w-0 flex-1">
      <span class="block text-[10px] font-bold tracking-widest text-cocoa-800/80 uppercase">
        {totals.totalQty} pcs · {totals.discountPercent > 0 ? `Diskon ${totals.discountPercent}%` : 'Belum ada diskon'}
      </span>
      <span class="emboss block font-mono text-lg leading-tight font-black text-cocoa-900">
        {formatRupiah(totals.totalBayar)}
      </span>
    </span>

    <span class="flex flex-none flex-col items-end">
      {#if totals.discountAmount > 0}
        <span class="chip chip-red">-{formatRupiah(totals.discountAmount)}</span>
      {/if}
      <span class="mt-1 flex items-center gap-1 text-[11px] font-bold text-cocoa-800">
        Rincian <Icon name="chevron" size={13} className="rotate-180" />
      </span>
    </span>
  </button>
</div>
