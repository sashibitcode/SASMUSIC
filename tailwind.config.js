/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // User's custom 3-color palette
        forest: {
          DEFAULT: '#06110c',
          950: '#040b08',
          900: '#06110c',
          800: '#0c1f17',
          700: '#143326',
        },
        charcoal: {
          DEFAULT: '#171717',
          950: '#111111',
          900: '#171717',
          800: '#212121',
          700: '#2c2c2c',
          600: '#383838',
        },
        crimson: {
          DEFAULT: '#A31C1B',
          50: '#fdf3f3',
          100: '#fce5e5',
          200: '#f9cfcf',
          300: '#f3abab',
          400: '#e87473',
          500: '#d74342',
          600: '#be2524',
          700: '#A31C1B', // Exact user crimson
          800: '#7f1413',
          900: '#5c0c0b',
          950: '#380504',
        },
        // Brand maps to Crimson scale
        brand: {
          50: '#fdf3f3',
          100: '#fce5e5',
          200: '#f9cfcf',
          300: '#f3abab',
          400: '#e87473',
          500: '#d74342',
          600: '#A31C1B', // Primary action
          700: '#8e1716',
          800: '#731211',
          900: '#5c0c0b',
          950: '#380504',
        },
        // Dark theme semantic surfaces
        dark: {
          bg: '#06110c',       // Forest Green deep background
          card: '#171717',     // Charcoal Black cards
          surface: '#222222',  // Elevated charcoal surface
          border: '#282f2b',   // Charcoal-forest subtle border
          subtle: '#333b37'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'equalizer-1': 'equalizer 0.8s ease-in-out infinite alternate',
        'equalizer-2': 'equalizer 0.5s ease-in-out infinite alternate 0.2s',
        'equalizer-3': 'equalizer 0.9s ease-in-out infinite alternate 0.4s',
        'equalizer-4': 'equalizer 0.6s ease-in-out infinite alternate 0.1s',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        equalizer: {
          '0%': { height: '30%' },
          '100%': { height: '100%' }
        }
      }
    },
  },
  plugins: [],
}
