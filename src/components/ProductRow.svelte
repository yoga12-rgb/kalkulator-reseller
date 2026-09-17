<script>
  import Icon from './Icon.svelte';

  let { product, qty = 0, onQty } = $props();

  const subtotal = $derived(qty * product.price);

  function handleInput(event) {
    onQty(event.currentTarget.value);
  }
</script>

<div
  class="panel flex items-center gap-3 p-2.5 transition-shadow"
  class:glow-gold={qty > 0}
>
  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2">
      <p class="truncate text-sm font-bold text-gold-100">{product.variant}</p>
      {#if product.note === 'mini'}
        <span class="chip">Mini</span>
      {/if}
    </div>
    <p class="font-mono text-xs text-gold-300/85">
      {new Intl.NumberFormat('id-ID').format(product.price)}
      <span class="text-gold-200/40">/box</span>
    </p>
    {#if qty > 0}
      <p class="mt-0.5 font-mono text-[11px] font-bold text-gold-200">
        = Rp{new Intl.NumberFormat('id-ID').format(subtotal)}
      </p>
    {/if}
  </div>

  <div class="panel-inset flex items-center gap-1 rounded-xl p-1">
    <button
      class="step-btn step-minus"
      disabled={qty === 0}
      onclick={() => onQty(qty - 1)}
      aria-label={`Kurangi ${product.variant}`}
      title="Kurangi"
    >
      <Icon name="minus" size={16} stroke={2.6} />
    </button>

    <input
      class="qty-input"
      type="number"
      inputmode="numeric"
      min="0"
      max="9999"
      value={qty || ''}
      placeholder="0"
      aria-label={`Jumlah ${product.variant}`}
      oninput={handleInput}
    />

    <button
      class="step-btn step-plus"
      onclick={() => onQty(qty + 1)}
      aria-label={`Tambah ${product.variant}`}
      title="Tambah"
    >
      <Icon name="plus" size={16} stroke={2.6} />
    </button>
  </div>
</div>
