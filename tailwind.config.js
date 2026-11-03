/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'midnight-bg': '#0a0a0f',
        'midnight-surface': '#0e0f18',
        'midnight-elevated': '#141520',
        'midnight-border': 'rgba(255,255,255,0.06)',
        'midnight-border-strong': 'rgba(255,255,255,0.12)',
        'midnight-ink': '#e8edf7',
        'midnight-ink-muted': '#8b95a8',
        'midnight-ink-subtle': '#5a6478',
        'midnight-accent': '#f59e0b',
        'midnight-accent-soft': 'rgba(245, 158, 11, 0.15)',
        'midnight-success': '#34d399',
        'midnight-danger': '#f87171',
      },
      fontFamily: {
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
        body: ['DM Sans', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}