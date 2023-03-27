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
        // primary: '#EAE0DA', //'card game colors'
        // secondary: '#A0C3D2',
        // primary: '#553E4E', eggplant
        // secondary: '#483644',
        primary: '#1e293b',
        secondary: '#815B5B',
        primaryDark: 'slate-800',
        // info: '#555555',
        info: '#F5DBCB',
        accent: '#3B185F',
        cardBack: '#F5DBCB',
        eggplant: '#533E4E',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
