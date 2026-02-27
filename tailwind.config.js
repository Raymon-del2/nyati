/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nyati: {
          dark: '#0a0a0a',
          gray: '#1a1a1a',
          steel: '#2d2d2d',
          teal: '#00d4aa',
          accent: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
};
