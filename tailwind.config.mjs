import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind 3.4.15 syntax: the `selector` strategy (added in 3.4) lets us pair
  // `dark:` with an arbitrary attribute selector instead of the older 'class'
  // strategy's fixed `.dark` class. `data-theme="dark"` is set on <html> by the
  // no-FOUC script in BaseLayout.astro. See docs/dark-mode.md.
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Dark-mode surface ramp ("coffee"), derived from the jewlarray.ch dark
        // theme (OKLCH-native, warm coffee-brown, hue band 40-75deg). Hex values
        // are used for maximum browser support (no color-mix() dependency for
        // opacity modifiers); OKLCH source values are documented per token so
        // the ramp can be regenerated/adjusted precisely. See
        // docs/dark-mode.md and the token spec for usage rules.
        coffee: {
          sunk: '#0f0704', // oklch(0.14 0.018 55) - inputs/wells, code-adjacent recesses
          page: '#190f09', // oklch(0.18 0.020 55) - body background
          raised: '#271d15', // oklch(0.24 0.022 58) - cards, panels, header/footer surfaces
          raised2: '#332619', // oklch(0.29 0.022 58) - popovers, dropdowns, hover-raised
          border: '#362b23', // oklch(0.30 0.022 60) - hairline borders, dividers
          'border-strong': '#4d3f33', // oklch(0.38 0.025 60) - emphasized borders, focus-adjacent
        },
        // Dark-mode text ramp ("cream"). Contrast verified against coffee-page
        // and coffee-raised (see token spec) - all pairs >=4.5:1.
        cream: {
          primary: '#ede3d5', // oklch(0.92 0.022 75) - headings, primary text (14.9:1 / 13.0:1)
          secondary: '#c4b4a3', // oklch(0.78 0.030 70) - body copy, descriptions (9.3:1 / 8.2:1)
          muted: '#8f8578', // oklch(0.62 0.025 70) - captions/meta/hints (bumped from jewlarray's 0.58, was 4.41:1 borderline); >=5.2:1 / >=4.6:1
          // Distinct token from `primary` - used ONLY for the single footer
          // "cream inverse band" (jewlarray signature echo), never for regular
          // dark-mode text. See docs/dark-mode.md.
          inverse: '#f3eadd',
        },
        // Warm touch accent (from jewlarray), used sparingly: link hover
        // underline decoration + blockquote/citation accents only. Never as a
        // text-on-gold or gold-on-text pair without dark ink (coffee-sunk).
        gold: '#d8a16c', // oklch(0.75 0.095 65)
        crystal: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        gem: {
          ruby: '#e11d48',
          sapphire: '#2563eb',
          emerald: '#059669',
          amethyst: '#7c3aed',
          topaz: '#f59e0b',
          diamond: '#f8fafc',
          garnet: '#be123c',
          peridot: '#84cc16',
          aquamarine: '#06b6d4',
          citrine: '#eab308',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      animation: {
        'crystal-rotate': 'crystal-rotate 20s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-in-up': 'slide-in-up 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        'crystal-rotate': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            p: {
              maxWidth: 'none',
            },
            code: {
              backgroundColor: '#f1f5f9',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            // Elegant list styling - dividers between items, no indent
            'ul': {
              listStyle: 'none',
              paddingLeft: '0',
              paddingInlineStart: '0',
              marginLeft: '0',
              marginInlineStart: '0',
              marginTop: '0',
              marginBottom: '0',
            },
            'ul > li': {
              paddingTop: '0.5em',
              paddingBottom: '0.5em',
              paddingLeft: '0',
              marginLeft: '0',
              borderBottom: '1px solid #e2e8f0',
            },
            'ul > li:last-child': {
              borderBottom: 'none',
            },
            'ul > li::before': {
              content: 'none',
            },
            'ul ul': {
              marginTop: '0.5em',
              marginLeft: '0',
              paddingLeft: '0',
              borderLeft: '2px solid #e2e8f0',
            },
            'ul ul > li': {
              borderBottom: 'none',
              paddingTop: '0.25em',
              paddingBottom: '0.25em',
              paddingLeft: '1em',
            },
            'ol': {
              listStyle: 'none',
              paddingLeft: '0',
              counterReset: 'item',
            },
            'ol > li': {
              position: 'relative',
              paddingLeft: '2em',
              counterIncrement: 'item',
            },
            'ol > li::before': {
              content: 'counter(item)',
              position: 'absolute',
              left: '0',
              top: '0',
              width: '1.5em',
              height: '1.5em',
              fontSize: '0.75em',
              fontWeight: '600',
              color: '#0369a1',
              backgroundColor: '#e0f2fe',
              borderRadius: '0.25em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
        },
        lg: {
          css: {
            maxWidth: 'none',
            p: {
              maxWidth: 'none',
            },
            // NOTE: the DEFAULT block above defines custom `ol`, `ol > li`,
            // `ol > li::before` (counter badge) and `ul > li::before` rules,
            // but @tailwindcss/typography generates `.prose-lg` as a fully
            // separate ruleset from its own built-in `lg` size config — it
            // does NOT inherit DEFAULT's custom overrides. That built-in `lg`
            // config sets its own `padding-inline-start` on `ol`, `ul`,
            // `ol > li` and `ul > li` (~0.44em), and because `.prose-lg`'s
            // rules are emitted after `.prose`'s in the stylesheet, its
            // logical `padding-inline-start` wins the cascade over our
            // physical `padding-left` from DEFAULT (per the CSS Logical
            // Properties spec, a logical/physical pair for the same edge is
            // resolved by cascade order, not by property name) — even though
            // both were set with equal selector specificity. That silently
            // shrank the reserved space for the absolute-positioned counter
            // badge under `prose-lg`, so the badge (1.5em wide) overlapped
            // the first ~19px of ordered-list text (regression from PR #55
            // switching body copy to `prose-lg`). Fix: replicate the same
            // rules here with BOTH the physical and logical property set,
            // so this override always wins regardless of which one the
            // browser resolves the box edge from. `ul > li` needed the same
            // treatment (residual ~8px indent creeping back in), which is
            // why it already carried `paddingInlineStart: '0'` below.
            'ul': {
              paddingLeft: '0',
              paddingInlineStart: '0',
              marginLeft: '0',
              marginInlineStart: '0',
            },
            'ul > li': {
              paddingLeft: '0',
              paddingInlineStart: '0',
              marginLeft: '0',
              marginInlineStart: '0',
            },
            'ul > li::before': {
              content: 'none',
            },
            'ol': {
              listStyle: 'none',
              paddingLeft: '0',
              paddingInlineStart: '0',
              counterReset: 'item',
            },
            'ol > li': {
              position: 'relative',
              paddingLeft: '2em',
              paddingInlineStart: '2em',
              counterIncrement: 'item',
            },
            'ol > li::before': {
              content: 'counter(item)',
              position: 'absolute',
              left: '0',
              top: '0',
              width: '1.5em',
              height: '1.5em',
              fontSize: '0.75em',
              fontWeight: '600',
              color: '#0369a1',
              backgroundColor: '#e0f2fe',
              borderRadius: '0.25em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};
