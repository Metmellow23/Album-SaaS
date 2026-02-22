// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        krm: {
          primary: '#1a3e72',
          secondary: '#e30613',
          light: '#f8f9fa',
          dark: '#212529',
          gray: '#6c757d',
        },
      },
    },
  },
  plugins: [],
};

export default config;