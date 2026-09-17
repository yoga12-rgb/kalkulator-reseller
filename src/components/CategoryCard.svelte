<script>
  import Icon from './Icon.svelte';
  import ProductRow from './ProductRow.svelte';

  let { category, items = [], qtyMap = {}, open = false, onToggle, onQty } = $props();

  const filledVariants = $derived(items.filter((p) => Number(qtyMap[p.id]) > 0).length);
  const categoryQty = $derived(items.reduce((sum, p) => sum + (Number(qtyMap[p.id]) || 0), 0));
  const categoryTotal = $derived(items.reduce((sum, p) => sum + (Number(qtyMap[p.id]) || 0) * p.price, 0));
</script>

<section class="panel-raised overflow-hidden">
  <button
    class="flex w-full items-center gap-3 px-3 py-3 text-left tap-none"
    onclick={onToggle}
    aria-expanded={open}
  >
    <span class="plate-gold grid h-10 w-10 flex-none place-items-center">
      <Icon name={category.icon} size={20} />
    </span>
    <span class="min-w-0 flex-1">
      <span class="emboss block font-display text-sm font-black tracking-wide text-gold-100 uppercase">
        {category.name}
      </span>
      <span class="block truncate text-[11px] text-gold-200/65">{category.tagline}</span>
    </span>
    {#if categoryQty > 0}
      <span class="badge-count">{categoryQty}</span>
      <span class="font-mono text-[11px] text-gold-200/80">Rp{new Intl.NumberFormat('id-ID').format(categoryTotal)}</span>
    {/if}
    <span class="grid h-7 w-7 flex-none place-items-center rounded-full border border-gold-500/40 text-gold-200">
      <Icon name="chevron" size={16} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
    </span>
  </button>

  {#if open}
    <div class="space-y-2 border-t border-gold-500/15 bg-cocoa-950/40 p-2.5">
      {#each items as product (product.id)}
        <ProductRow {product} qty={Number(qtyMap[product.id]) || 0} onQty={(value) => onQty?.(product.id, value)} />
      {/each}
      {#if filledVariants > 0}
        <p class="pt-0.5 text-center text-[11px] text-gold-200/60">
          {filledVariants} varian terisi · {categoryQty} pcs
        </p>
      {/if}
    </div>
  {/if}
</section>
