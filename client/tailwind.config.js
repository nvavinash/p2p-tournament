/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: '#0a0a0a',
          surface: '#1a1a1a',
          primary: '#f97316', // Orange-500
          secondary: '#fdba74', // Orange-300
          text: '#fafafa',
          muted: '#a3a3a3',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          heading: ['Orbitron', 'sans-serif'], // We'll need to import this
        },
      },
    },
    plugins: [],
  }
