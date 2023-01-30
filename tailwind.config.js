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
      p: {
        0.5: '0.125em',
      },
      colors: {
        // primary: '#C060A1',
        // // secondary: '#EAE0DA', steph
        // secondary: '#EAE0DA',
        // // info: '#000000', steph
        // info: '#000000',
        // accent: '#3B185F',
        primary: '#EAE0DA',
        secondary: '#A0C3D2',
        info: '#555555',
        accent: '#3B185F',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
