<script>
  /** Ikon stroke SVG sederhana (mirip Feather) - tanpa dependensi eksternal. */
  const PATHS = {
    calculator:
      '<rect x="4" y="2" width="16" height="20" rx="3"/><rect x="7" y="5" width="10" height="4" rx="1"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
    receipt:
      '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h3"/>',
    history:
      '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3L3 8.5"/><path d="M3 3.5v5h5"/><path d="M12 8v4.5l3 1.8"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/><path d="M10 10v7M14 10v7"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    chat: '<path d="M20 12a8 8 0 0 1-11.9 7L4 20l1-4.1A8 8 0 1 1 20 12z"/><path d="M9 11h6M9 14h3"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M4 12.5 9 18 20 6"/>',
    spark: '<path d="M12 3l2.2 5.3L20 10l-4.4 3.6L17 20l-5-3-5 3 1.4-6.4L4 10l5.8-1.7z"/>',
    install:
      '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h2.5l2.2 11.2A2 2 0 0 0 8.7 16h9.8a2 2 0 0 0 2-1.6L22 7H6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
    offline:
      '<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M5.5 12.9a10 10 0 0 1 3.2-2.3"/><path d="M15.3 10.6a10 10 0 0 1 3.2 2.3"/><path d="M2.5 8.9A15 15 0 0 1 7 5.6"/><path d="M17 5.6a15 15 0 0 1 4.5 3.3"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    percent:
      '<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    medal:
      '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 3h7l-.8 4.4a6 6 0 0 0-5.4 0z"/><path d="M12 12.6l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>',
    basket:
      '<path d="M4 9h16l-1.4 10a2 2 0 0 1-2 1.7H7.4a2 2 0 0 1-2-1.7z"/><path d="M8 9 12 3l4 6"/><path d="M10 13v4M14 13v4"/>',
    roll: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M8 7c0 2.8 1.8 5 4 5s4-2.2 4-5"/><path d="M12 17v4"/>',
    cake: '<path d="M3 20h18v-5.5a2.5 2.5 0 0 0-2.5-2.5h-13A2.5 2.5 0 0 0 3 14.5z"/><path d="M12 12V7"/><path d="M12 4.5V3"/><path d="M7 12V9.5M17 12V9.5"/>',
    bread: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M6 13v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5"/><path d="M10 13v6M14 13v6"/>',
  };

  let {
    name = 'info',
    size = 20,
    stroke = 1.9,
    class: className = '',
  } = $props();

  const content = $derived(PATHS[name] ?? PATHS.info);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  aria-hidden="true"
  focusable="false"
>
  {@html content}
</svg>
