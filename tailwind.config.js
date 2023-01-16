/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      flex: {
        2: '2 2 0%',
        3: '3 3 0%',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
