/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#2c3e50',
          blue: '#3498db',
          green: '#2ecc71',
          red: '#e74c3c',
          purple: '#9b59b6',
        }
      },
    },
  },
  plugins: [],
}

