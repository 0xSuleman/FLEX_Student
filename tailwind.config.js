/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Sans"', 'Calibri', 'system-ui', 'sans-serif'],
        display: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        // page + cards (light blue/ice)
        paper:  '#E8F0FA',
        cream:  '#F8FAFC',
        bone:   '#FFFFFF',
        sand:   '#E2E8F0',
        tan:    '#CBD5E1',
        // deep navy ladder (sidebar / nav / top bar)
        coffee: '#132748',
        cocoa:  '#0A1A33',
        ink:    '#040E21',
        // sky accents (buttons, tags, decor blobs)
        burn:   '#0EA5E9',
        burnL:  '#38BDF8',
        sienna: '#0284C7',
        rust:   '#0369A1',
        // status
        mustard:'#F59E0B',
        moss:   '#10B981',
        mossL:  '#34D399',
        bad:    '#DC2626',
        badL:   '#EF4444',
        // login brown palette (separate from dashboard navy)
        brown: {
          paper:   '#F9F2DE',
          cream:   '#FFFAEA',
          bone:    '#FAF3DD',
          sand:    '#EADBB9',
          tan:     '#D9B88A',
          coffee:  '#6B3A1C',
          cocoa:   '#4A2612',
          ink:     '#2A1508',
          burn:    '#D96E3A',
          burnL:   '#E88B5E',
          mustard: '#C9902B',
          moss:    '#8A9B55',
          mossL:   '#A5B86E',
        },
      },
      boxShadow: {
        'pixel':    '4px 4px 0 0 #040E21',
        'pixel-lg': '6px 6px 0 0 #040E21',
        'pixel-sm': '2px 2px 0 0 #040E21',
        'pixel-burn': '4px 4px 0 0 #0369A1',
        'soft-warm':'0 2px 8px rgba(15, 23, 42, 0.08), 0 6px 20px rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'blink': 'blink 1.2s steps(2) infinite',
      },
      keyframes: {
        blink: { '0%,49%': { opacity: 1 }, '50%,100%': { opacity: 0 } },
      },
    },
  },
  plugins: [],
}
