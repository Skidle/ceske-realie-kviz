/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#F7F4FF',
          100: '#F0EBFF',
          200: '#E3D9FF', // Your color
          300: '#D6CAFF',
          400: '#C9BBFF',
          500: '#BCA9FF',
          600: '#A08EFF',
          700: '#8470FF',
          800: '#6952CC',
          900: '#503DA6',
        },
        indigo: {
          50: '#F6F3F7',
          100: '#EDE7EF',
          200: '#DCD0E0',
          300: '#CAB8D0',
          400: '#B8A1C1',
          500: '#987AA8',
          600: '#603E6B', // Base color
          700: '#4D3256',
          800: '#3A2642',
          900: '#281A2D',
          950: '#1C121F'
        },
        pink: {
          50: '#FEF1F5',
          100: '#FEE5EC',
          200: '#FCC7D9',
          300: '#FA99B9',
          400: '#F66A98',
          500: '#E1306C',  // Base color
          600: '#D12860',
          700: '#B31D4B',
          800: '#91173C',
          900: '#731331',
          950: '#4C0A1F'
        },
      }
    },
  },
  plugins: [],
}

