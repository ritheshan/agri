/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'farm-green': '#22c55e',
        'farm-yellow': '#fbbf24',
        'farm-light-green': '#84cc16',
        'farm-brown': '#92400e',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'float': 'float 3s ease-in-out infinite',
        'cart-move': 'cart-move 4s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'cart-move': {
          '0%': { transform: 'translateX(-50px)' },
          '50%': { transform: 'translateX(50px)' },
          '100%': { transform: 'translateX(-50px)' },
        }
      }
    },
  },
  plugins: [],
}
