/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0A0A0B',
          surface: '#0E0E11',
          raised:  '#111113',
          card:    '#141418',
          hover:   '#1A1A1E',
          active:  '#222228',
        },
        border: {
          subtle:  'rgba(255,255,255,0.05)',
          default: 'rgba(255,255,255,0.08)',
          strong:  'rgba(255,255,255,0.14)',
        },
        text: {
          primary:   '#EAEAF5',
          secondary: '#9090A8',
          tertiary:  '#606078',
          muted:     '#404055',
        },
        accent: {
          purple: '#6E56CF',
          'purple-hover': '#7C65DC',
          'purple-dim':   'rgba(110,86,207,0.15)',
          'purple-glow':  'rgba(110,86,207,0.25)',
        },
        status: {
          green:      '#3DD68C',
          'green-dim':'rgba(61,214,140,0.12)',
          amber:      '#F76B15',
          'amber-dim':'rgba(247,107,21,0.12)',
          red:        '#E5484D',
          'red-dim':  'rgba(229,72,77,0.12)',
          blue:       '#3B9EDE',
          'blue-dim': 'rgba(59,158,222,0.12)',
          teal:       '#5CB8B2',
          'teal-dim': 'rgba(92,184,178,0.12)',
        },
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'SF Mono', 'monospace'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:    ['11px', '16px'],
        sm:    ['12px', '18px'],
        base:  ['13px', '20px'],
        md:    ['14px', '22px'],
        lg:    ['15px', '24px'],
        xl:    ['16px', '26px'],
        '2xl': ['18px', '28px'],
        '3xl': ['22px', '30px'],
        '4xl': ['28px', '34px'],
      },
      borderRadius: {
        sm:  '5px',
        md:  '7px',
        lg:  '10px',
        xl:  '14px',
        '2xl': '18px',
      },
      boxShadow: {
        'card': '0 0 0 0.5px rgba(255,255,255,0.08)',
        'glow-purple': '0 0 20px rgba(110,86,207,0.3)',
        'glow-green':  '0 0 12px rgba(61,214,140,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'blink':      'blink 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}