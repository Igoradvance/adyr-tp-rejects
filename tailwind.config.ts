import type { Config } from 'tailwindcss'

// ─── ADYR design tokens (shared with adyr-quality-tracker) ───────────────────
// Navy scale derived from the ADYR logo. `blue` is aliased to it so every
// existing `bg-blue-600` / `ring-blue-500` in the codebase picks up the brand
// palette without touching each component.
const navy = {
  50: '#F3F6FA',
  100: '#E3EAF3',
  200: '#C7D4E4',
  300: '#9DB2CB',
  400: '#5F7EA3',
  500: '#2C5282',
  600: '#1B3A5C',
  700: '#0F2A4A',
  800: '#0B1F38',
  900: '#071628',
}

const teal = {
  50: '#EAF7F5',
  100: '#D6F1EE',
  200: '#ADE3DD',
  300: '#7ED0C7',
  400: '#4FB8AD',
  500: '#2A9D8F',
  600: '#1F8A8A',
  700: '#186F70',
  800: '#125556',
  900: '#0C3B3C',
}

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy,
        teal,
        blue: navy,
        surface: '#FFFFFF',
        line: '#E4EAF2',
        ink: { DEFAULT: '#0F1F33', muted: '#5B6B80', faint: '#8A99AD' },
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'Heebo', 'Segoe UI', 'Arial Hebrew', 'Arial', 'sans-serif'],
        mono: ['var(--font-heebo)', 'Heebo', 'Segoe UI', 'Arial Hebrew', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,31,51,0.06), 0 1px 3px rgba(15,31,51,0.04)',
        md: '0 4px 14px rgba(15,31,51,0.08), 0 1px 3px rgba(15,31,51,0.05)',
        lg: '0 14px 40px rgba(15,31,51,0.14)',
        xl: '0 24px 64px rgba(0,0,0,0.30)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
export default config
