export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: '#15112B', plum: '#1E1940', grape: '#2B2552', line: '#3D3670',
        snow: '#F4F1FF', muted: '#A9A1D3',
        sun: '#FFC83D', pink: '#FF5C8A', blue: '#6C8CFF', mint: '#38E0B0', violet: '#A678FF', tangerine: '#FF8A3D',
        danger: '#FF5C7A',
      },
      keyframes: {
        pop: { '0%': { opacity: 0, transform: 'scale(.85) translateY(10px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { pop: 'pop .5s cubic-bezier(.2,.9,.3,1.2) both' },
    },
  },
  plugins: [],
};
