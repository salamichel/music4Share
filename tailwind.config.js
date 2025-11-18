/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Copper - Orange cuivré (#D86B29)
        copper: {
          50: '#FDF5F0',
          100: '#FAE8DC',
          200: '#F5D1B9',
          300: '#EFBA96',
          400: '#E29260',
          500: '#D86B29', // Base color
          600: '#B85820',
          700: '#8F441A',
          800: '#663014',
          900: '#3D1C0C',
        },
        // Carmin - Rouge profond (#BE123D)
        carmin: {
          50: '#FDF2F5',
          100: '#FAE0E7',
          200: '#F5C1CF',
          300: '#EFA2B7',
          400: '#E35687',
          500: '#BE123D', // Base color
          600: '#9F0F33',
          700: '#7A0B27',
          800: '#56081C',
          900: '#320510',
        },
        // Warm neutrals to complement the warm palette
        warmgray: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
    },
  },
  plugins: [],
}
