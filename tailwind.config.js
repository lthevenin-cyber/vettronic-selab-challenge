/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        vet: {
          teal: "#009c8a",
          green: "#55bf7a",
          blue: "#00a4df",
          ink: "#15364a",
          sun: "#ffd166",
          coral: "#ff6b6b",
        },
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 54, 74, 0.14)",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
