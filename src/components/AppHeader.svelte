<script>
  import Icon from './Icon.svelte';

  let { installable = false, onInstall, updateAvailable = false, onReload } = $props();
</script>

<header class="safe-top sticky top-0 z-30 rounded-none border-x-0 border-t-0 px-3 pb-2 panel-raised safe-x">
  <div class="flex items-center gap-3">
    <div class="plate-gold grid h-11 w-11 flex-none place-items-center">
      <Icon name="basket" size={22} />
    </div>
    <div class="min-w-0 flex-1">
      <h1 class="emboss font-display text-base leading-tight font-black tracking-wide text-gold-100 uppercase">
        Kalkulator Reseller
      </h1>
      <p class="truncate text-[11px] text-gold-200/70">Rajaklana · Abon Gulung &amp; Bolu Susu</p>
    </div>
    {#if installable}
      <button class="btn btn-brass px-3 py-2 text-[11px]" onclick={onInstall} title="Pasang aplikasi ke layar utama">
        <Icon name="install" size={16} />
        Pasang
      </button>
    {/if}
  </div>

  {#if updateAvailable}
    <div class="mt-2 flex items-center gap-2 rounded-xl border border-gold-500/40 bg-cocoa-950/60 px-3 py-2">
      <Icon name="refresh" size={16} class="text-gold-300" />
      <p class="flex-1 text-[11px] font-bold text-gold-100">Versi baru tersedia</p>
      <button class="btn btn-brass px-3 py-1.5 text-[11px]" onclick={onReload}>Muat ulang</button>
    </div>
  {/if}
</header>
