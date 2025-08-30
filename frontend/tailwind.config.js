// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your final color palette
        'brand-red': '#e63946',
        'brand-honeydew': '#f1faee',
        'brand-light-blue': '#a8dadc',
        'brand-medium-blue': '#457b9d',
        'brand-dark-blue': '#1d3557',
        
        // Semantic role assignments
        gray: {
          50: '#f1faee',    // Honeydew for the page background
          200: '#d8dde4',  // A light border color
          600: '#5e6c84',  // Lighter text for paragraphs
          900: '#1d3557',   // Dark navy text (Berkeley Blue)
        },
        brand: {
          primary: '#e63946',         // Red for primary actions
          card1: '#457b9d',             // Cerulean for a card
          card2: '#a8dadc',             // Non-Photo Blue for a card
        },
      },
      keyframes: {
        'slide-up-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shape-float1': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(10deg)' },
        },
        'shape-float2': {
          '0%, 100%': { transform: 'translateY(0) rotate(-8deg)' },
          '50%': { transform: 'translateY(-15px) rotate(0deg)' },
        },
        'form-fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-up-fade-in': 'slide-up-fade-in 0.6s ease-out both',
        'fade-in-down-slow': 'fade-in-down 1s ease-out 0.2s both',
        'fade-in-down-normal': 'fade-in-down 1s ease-out 0.4s both',
        'fade-in-down-fast': 'fade-in-down 1s ease-out 0.6s both',
        'shape-float1': 'shape-float1 8s ease-in-out infinite',
        'shape-float2': 'shape-float2 10s ease-in-out infinite',
        'form-fade-in': 'form-fade-in 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}