/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Body copy -- rounded, high-legibility grotesk, matching the
        // reference design system's DM Sans body text.
        sans: [
          'DM Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Headlines / display type -- used via the `font-display` utility
        // on hero titles and page headings, matching the reference's bold
        // Lexend headline treatment.
        display: [
          'Lexend',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Neutral scale -- Tailwind's slate palette, matching the
        // reference site's cool-gray text/background system.
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Primary brand color -- blue, matching the reference's nav /
        // dashboard / secondary-action blue (#2563eb sits at brand-600).
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // High-emphasis CTA color -- orange, matching the reference's
        // primary "Start Free Trial"-style call-to-action buttons.
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        emergency: {
          50: '#fdf2f2',
          100: '#fbdfdf',
          200: '#f7c1c1',
          300: '#f09898',
          400: '#e56b6b',
          500: '#d5423f',
          600: '#b52c2c',
          700: '#932325',
          800: '#7a2023',
          900: '#671f22',
        },
        // Emerald, matching the reference's success/positive-stat accent.
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Amber, matching the reference's warning/pending-state accent.
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      boxShadow: {
        // Soft, barely-there card shadow -- matching the reference's
        // `0 4px 20px rgba(0,0,0,0.05)` resting card elevation.
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 20px rgba(15, 23, 42, 0.06)',
        // Larger, cooler-toned elevation for hover/open states -- matching
        // the reference's `shadow-xl`-style dropdown/modal elevation.
        'card-hover': '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
        sheet: '0 -8px 30px rgba(2, 6, 23, 0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.35, 1) infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
