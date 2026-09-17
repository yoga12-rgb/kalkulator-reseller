<script>
  import Icon from './Icon.svelte';
  import { formatRupiah, formatNumber, VOUCHER_MIN } from '../lib/pricing.js';

  let { tiers = [], totals, upgrade = null } = $props();

  const voucherTiers = $derived(tiers.filter((t) => t.percent > 0));
  const filledPercent = $derived(
    totals.nextTier
      ? Math.min(
          100,
          Math.max(
            4,
            Math.round(
              ((totals.totalNormal - totals.tier.min) / (totals.nextTier.min - totals.tier.min)) * 100,
            ),
          ),
        )
      : 100,
  );
  const progressNote = $derived(
    totals.nextTier
      ? `Kurang ${formatRupiah(totals.amountToNextTier)} lagi untuk diskon ${totals.nextTier.percent}%`
      : 'Sudah diskon maksimal 26% 🎉',
  );
</script>

<section class="flyer relative overflow-hidden rounded-2xl p-3">
  <div class="absolute -top-6 -right-4 h-24 w-24 rounded-full bg-gold-300/15 blur-xl"></div>

  <div class="relative flex items-center gap-2">
    <span class="plate-gold grid h-9 w-9 flex-none place-items-center">
      <Icon name="percent" size={18} />
    </span>
    <div class="min-w-0">
      <h2 class="emboss font-display text-sm font-black tracking-widest text-gold-100 uppercase">
        Voucher Reseller
      </h2>
      <p class="text-[11px] text-gold-200/75">Berlaku dari total harga normal (sebelum diskon)</p>
    </div>
  </div>

  <div class="relative mt-3 grid grid-cols-2 gap-2">
    {#each voucherTiers as tier (tier.id)}
      {@const active = tier.id === totals.tier.id}
      <div class="tier-card" class:tier-card-on={active}>
        <p class="font-display text-2xl leading-none font-black">{tier.percent}%</p>
        <p class="mt-1 text-[10px] leading-tight font-bold tracking-wide uppercase">{tier.headline}</p>
        <p class="mt-0.5 text-[9px] opacity-70">{tier.label}</p>
        {#if active}
          <span class="tier-stamp chip chip-gold">
            <Icon name="check" size={11} stroke={3} /> Aktif
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="relative mt-3 rounded-xl border border-gold-500/30 bg-cocoa-950/55 p-2.5">
    <div class="flex items-baseline justify-between gap-2">
      <p class="text-[11px] font-bold tracking-wide text-gold-200/80 uppercase">Total belanja</p>
      <p class="font-mono text-sm font-bold text-gold-100">{formatRupiah(totals.totalNormal)}</p>
    </div>

    <div class="progress-track mt-2">
      <div class="progress-fill" style={`width:${filledPercent}%`}></div>
    </div>
    <p class="mt-1.5 text-[11px] text-gold-200/80">{progressNote}</p>

    {#if totals.totalQty > 0}
      <div class="mt-2 grid grid-cols-3 gap-2 border-t border-gold-500/20 pt-2 text-center">
        <div>
          <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Diskon</p>
          <p class="font-mono text-xs font-bold text-gold-100">{totals.discountPercent}%</p>
        </div>
        <div>
          <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Hemat</p>
          <p class="font-mono text-xs font-bold text-gold-100">{formatRupiah(totals.discountAmount)}</p>
        </div>
        <div>
          <p class="text-[10px] tracking-wide text-gold-200/70 uppercase">Total bayar</p>
          <p class="font-mono text-xs font-bold text-gold-100">{formatRupiah(totals.totalBayar)}</p>
        </div>
      </div>
    {/if}
  </div>

  {#if upgrade}
    <div class="relative mt-2 rounded-xl border border-leaf-500/40 bg-leaf-600/20 p-2.5">
      <p class="flex items-center gap-1.5 text-[11px] font-bold text-gold-100">
        <Icon name="spark" size={14} class="text-gold-300" />
        Tips naik ke diskon {upgrade.tier.percent}%
      </p>
      <p class="mt-1 text-[11px] leading-relaxed text-gold-100/85">
        Tambah <span class="font-mono font-bold">{upgrade.addQty} box</span> varian termurah
        ({formatRupiah(upgrade.cheapestPrice)}/box = {formatRupiah(upgrade.addCost)}), total jadi
        <span class="font-mono font-bold">{formatRupiah(upgrade.newNormal)}</span> dan bayar
        <span class="font-mono font-bold">{formatRupiah(upgrade.newBayar)}</span>.
        {#if upgrade.extraBayar <= 0}
          Lebih hemat <span class="font-mono font-bold">{formatRupiah(Math.abs(upgrade.extraBayar))}</span> dari sekarang.
        {:else}
          Tambahan biaya <span class="font-mono font-bold">{formatRupiah(upgrade.extraBayar)}</span> dari sekarang.
        {/if}
      </p>
    </div>
  {/if}

  <div class="relative mt-2 flex items-start gap-2 rounded-xl border border-gold-500/25 bg-cocoa-950/40 p-2.5">
    <Icon name="info" size={14} class="mt-0.5 flex-none text-gold-300" />
    <p class="text-[10px] leading-relaxed text-gold-200/75">
      Minimal belanja {formatRupiah(VOUCHER_MIN)} (harga normal) untuk dapat voucher. Diskon dihitung dari total harga
      normal seluruh varian, lalu dibulatkan ke rupiah terdekat. Total varian saat ini:
      <span class="font-mono font-bold">{formatNumber(totals.totalQty)} box</span>.
    </p>
  </div>
</section>
