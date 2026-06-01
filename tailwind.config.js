/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pitch: '#04130b',
        'night-950': '#03040a',
        'night-900': '#070912',
        'night-800': '#0d1220',
        'electric-lime': '#b7ff2a',
        'electric-blue': '#28d9ff',
        'trophy-gold': '#f7c948',
        'hot-red': '#ff2d55',
        'ultra-violet': '#8b5cf6',
        'fifa-blue': '#001f5b',
        'fifa-dark': '#000814',
        'fifa-orange': '#ff6b00',
        'ge-red': '#c8102e',
        'ge-gray': '#f5f5f5',
      },
      boxShadow: {
        glow: '0 0 40px rgba(40,217,255,0.24)',
        'glow-red': '0 0 44px rgba(255,45,85,0.28)',
        'glow-lime': '0 0 44px rgba(183,255,42,0.22)',
        'glow-orange': '0 0 44px rgba(255,107,0,0.28)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.6s linear infinite',
        pulseLive: 'pulse-live 1.4s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-live': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
      },
    },
  },
  plugins: [],
}