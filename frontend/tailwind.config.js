/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        reddit: {
          primary: '#FF4500',    // Reddit orange
          accent: '#FFB000',     // Warm gold
          bg: '#F6F7F8',         // Light background
          dark: '#1A1A1B',       // Dark background
          gray: '#878A8C',       // Text gray
          border: '#EDEFF1',     // Border gray
          upvote: '#FF8717',     // Upvote orange
          downvote: '#7193FF',   // Downvote blue
        }
      },
      fontFamily: {
        'reddit': ['IBM Plex Sans', 'Roboto', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}