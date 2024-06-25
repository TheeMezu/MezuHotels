/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    container: {
      padding: {
        md: "10rem"
      }
    }
  },
  plugins: [],
}

// content specifies whatt files will accept the styling
// index.html is the main file that runs that runs everything else 