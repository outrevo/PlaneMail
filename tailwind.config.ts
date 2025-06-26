
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Liquid Glass Colors
        glass: {
          white: 'rgba(255, 255, 255, 0.8)',
          'white-dark': 'rgba(255, 255, 255, 0.1)',
          'white-light': 'rgba(255, 255, 255, 0.05)',
          black: 'rgba(0, 0, 0, 0.8)',
          'black-light': 'rgba(0, 0, 0, 0.1)',
          'black-dark': 'rgba(0, 0, 0, 0.2)',
          blue: 'rgba(0, 122, 255, 0.8)',
          'blue-light': 'rgba(0, 122, 255, 0.1)',
          'blue-dark': 'rgba(0, 122, 255, 0.2)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'shine': { 
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'image-shine': { 
          '0%': { transform: 'translateX(-100%) skewX(-12deg)' }, 
          '100%': { transform: 'translateX(200%) skewX(-12deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shine-slow': 'shine 5s linear infinite',
        'shine-fast': 'shine 3s linear infinite',
        'image-shine': 'image-shine 1.5s linear infinite', 
      },
      backgroundImage: {
        'gradient-radial-custom': 'radial-gradient(circle, hsl(var(--foreground) / 0.03) 1px, transparent 1px)',
        'metallic-text': 'linear-gradient(to bottom, hsl(var(--foreground) / 0.8), hsl(var(--foreground) / 1), hsl(var(--foreground) / 0.9))',
        // For light theme, base text is dark, shine is a subtle light overlay
        'metallic-shine': 'linear-gradient(to right, transparent, hsl(var(--foreground) / 0.05), transparent)', 
        'feature-card': 'linear-gradient(to bottom, hsl(var(--card)), hsl(var(--background) / 0.8))',
        // Liquid Glass gradients
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        'glass-border': 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))',
        'glass-mesh': 'radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 60%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
      },
      backgroundSize: {
        '200%': '200% auto',
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: theme('colors.foreground'),
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.DEFAULT / 0.8'),
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              fontFamily: theme('fontFamily.sans').join(', '),
              color: theme('colors.foreground'),
            },
             // Add more styles for other elements if needed
          },
        },
      }),
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
