import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0b0f1a',
        s1:       '#111827',
        s2:       '#1f2937',
        s3:       '#374151',
        primary:  '#6366f1',
        violet:   '#8b5cf6',
        success:  '#10b981',
        warning:  '#f59e0b',
        danger:   '#ef4444',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
