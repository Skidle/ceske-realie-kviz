// Create React App detected tailwind.config.js and wired Tailwind into PostCSS
// automatically. Vite does not, so the plugins are declared explicitly here.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
