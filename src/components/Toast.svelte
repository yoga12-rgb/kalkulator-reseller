<script>
  import Icon from './Icon.svelte';

  let { message = null, tone = 'info' } = $props();

  const toneClass = $derived(
    tone === 'error'
      ? 'text-chili-600'
      : tone === 'success'
        ? 'text-leaf-600'
        : 'text-cocoa-800',
  );
  const iconName = $derived(tone === 'error' ? 'alert' : tone === 'success' ? 'check' : 'info');
</script>

{#if message}
  <div class="below-header pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3">
    <div
      class="animate-rise flex max-w-md items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-2xl backdrop-blur
             plate-gold"
      role="status"
      aria-live="polite"
    >
      <span class="grid h-6 w-6 flex-none place-items-center rounded-full bg-cocoa-900/85 text-gold-200">
        <Icon name={iconName} size={14} />
      </span>
      <span class={toneClass}>{message}</span>
    </div>
  </div>
{/if}
