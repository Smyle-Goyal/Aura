/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F8F7F3',
          card: '#FFFFFF',
          muted: '#F2EFE9',
          border: '#E5E2DA',
          borderDark: '#DCD8CE',
        },
        ink: {
          DEFAULT: '#202622',
          light: '#566059',
          muted: '#848E87',
          subtle: '#ADB5AF',
        },
        forest: {
          50: '#F1F5F3',
          100: '#E1EBE5',
          200: '#C2D7CB',
          300: '#94B8A3',
          400: '#5F9276',
          500: '#355C4A', // Primary accent
          600: '#2B4B3C',
          700: '#233D31',
          800: '#1B2F26',
        },
        sage: {
          50: '#F5F7F4',
          100: '#E9EFE8',
          200: '#D5DFD3',
          300: '#B6C5B3',
          400: '#8F9E8B', // Secondary accent
          500: '#73836F',
        },
        amber: {
          50: '#FEF9F3',
          100: '#FDF3E7',
          200: '#F9E2C6',
          300: '#F3C79A',
          400: '#E6A265',
          500: '#C27D38', // Uncertainty / Warning accent
          600: '#A16227',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'paper-sm': '0 1px 2px 0 rgba(32, 38, 34, 0.04)',
        'paper': '0 2px 8px -2px rgba(32, 38, 34, 0.06), 0 1px 4px -1px rgba(32, 38, 34, 0.04)',
        'paper-md': '0 6px 16px -4px rgba(32, 38, 34, 0.08), 0 2px 6px -2px rgba(32, 38, 34, 0.04)',
        'paper-lg': '0 12px 28px -6px rgba(32, 38, 34, 0.10), 0 4px 10px -2px rgba(32, 38, 34, 0.05)',
      }
    },
  },
  plugins: [],
}
