import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F17',
        surface: '#111827',
        'surface-2': '#1F2937',
        border: {
          DEFAULT: '#1E293B',
          strong: '#334155',
        },
        primary: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
        },
        cyan: '#06B6D4',
        blue: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        ink: {
          DEFAULT: '#E2E8F0',
          muted: '#94A3B8',
          faint: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        control: '12px',
        card: '16px',
        modal: '18px',
      },
      boxShadow: {
        'ai-glow': '0 0 0 1px rgba(99, 102, 241, 0.4), 0 8px 24px -4px rgba(6, 182, 212, 0.15)',
      },
      backdropBlur: {
        topbar: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
