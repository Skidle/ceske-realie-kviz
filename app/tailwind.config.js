/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // The Czech flag: blue #11457E, red #D7141A, white.
        //
        // Blue carries the identity — buttons, links, headings. Red is deliberately kept
        // out of the brand and reserved for a wrong answer, because a red that means
        // "our colour" and a red that means "you got this wrong" cannot coexist without
        // making feedback ambiguous.
        flag: {
          50: '#F2F5FA',
          100: '#E3EAF4',
          200: '#C2D2E8',
          300: '#94AFD4',
          400: '#5C81B4',
          500: '#2C5793',
          600: '#11457E', // the flag's blue
          700: '#0E3868',
          800: '#0B2C52',
          900: '#08203C',
        },
        // Used for incorrect answers, nothing else.
        wrong: {
          50: '#FDF2F2',
          100: '#FBE3E4',
          500: '#D7141A', // the flag's red
          600: '#B81015',
          700: '#8F0C10',
        },
      },
    },
  },
  plugins: [],
};
