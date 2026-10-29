import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2563eb',
          light: '#eff6ff',
          dark: '#1d4ed8',
        },
        border: '#e2e8f0',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['14px', '1.5'],
      },
    },
  },
  plugins: [],
}

export default config
