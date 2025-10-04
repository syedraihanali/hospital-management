/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['\'Inter\'', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#12a97b',
          dark: '#0c7a56',
          accent: '#3dd6a7',
          secondary: '#e8f7f0',
        },
      },
      boxShadow: {
        glass: '0 30px 80px -40px rgba(15, 157, 88, 0.45)',
        soft: '0 18px 50px -35px rgba(15, 23, 42, 0.4)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
