/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        bebas:  ['"Bebas Neue"', 'sans-serif'],
        dm:     ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          bg:      '#f5f3ee',
          surface: '#ffffff',
          red:     '#c0392b',
          'red-dark': '#a93226',
          muted:   '#7a7065',
          text:    '#2c2c2c',
          blue:    '#2980b9',
          green:   '#27ae60',
          error:   '#e74c3c',
        }
      }
    }
  },
  plugins: []
}