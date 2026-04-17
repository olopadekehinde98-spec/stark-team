import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base:         '#07090F',
        surface:      '#0E1420',
        surface2:     '#131C2E',
        surface3:     '#1A2540',
        border:       '#1E2D47',
        gold:         '#C9A84C',
        'gold-light': '#E8C96A',
        'gold-dim':   '#C9A84C33',
        'text-primary':   '#F0EDE6',
        'text-secondary': '#9AA3B2',
        'text-muted':     '#4A5568',
        verified:     '#22C55E',
        pending:      '#8B5CF6',
        rejected:     '#EF4444',
        unverified:   '#6B7A96',
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body:    ['Outfit', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        'gold-glow':    '0 0 0 1px #C9A84C44, 0 0 16px #C9A84C22',
        'gold-row':     '0 0 0 1px #C9A84C33, 0 2px 12px #C9A84C14',
        'card':         '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px #1E2D47',
        'card-hover':   '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px #C9A84C22',
        'inner-top':    'inset 0 1px 0 rgba(201,168,76,0.08)',
      },
    },
  },
  plugins: [],
}
export default config
