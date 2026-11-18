/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#cf0000ff', // Principal Red - MoveFlow Signature
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        slate: {
          850: '#151e2e',
          950: '#090d16',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        heading: ['Syne', 'Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
        'subtle': '10px',
        'pill': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
        'brand': '0 10px 25px -5px rgba(225, 29, 72, 0.25)',
      }
    },
  },
  plugins: [],
}

