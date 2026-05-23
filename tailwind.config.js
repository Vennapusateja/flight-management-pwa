/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          50: '#0f172a',        // Titling (deep navy)
          100: '#1e293b',       // Primary body (readable dark navy-slate)
          200: '#334155',       // Intermediate body
          300: '#475569',       // Subtitles / placeholders
          400: '#64748b',       // Muted text
          500: '#3b82f6',       // Deep sky blue primary
          600: '#2563eb',       // Slate dark-sky accent
          700: '#93c5fd',       // Cloud highlight borders
          800: '#e2e8f0',       // Main card border (light cloud border)
          900: '#ffffff',       // Premium white cloud card bg
          950: '#f0f9ff',       // Master sky blue canvas background
        },
        indigo: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#0284c7',       // Sky blue accent highlights
          500: '#0ea5e9',       // Focus states
          600: '#0284c7',       // Primary buttons sky-blue
          700: '#0369a1',       // Hover states
          800: '#075985',
          900: '#0c4a6e',
          950: '#e0f2fe',       // Soft sky-100 pills background
        },
      },
      animation: {
        'in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
