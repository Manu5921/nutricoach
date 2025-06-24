import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/styles/**/*.css"
  ],
  theme: {
    extend: {
      /* Custom design tokens are defined in the global CSS file using @theme directive */
      /* This allows for better CSS variable support and Tailwind v4 compatibility */
      
      /* Override default font families if needed */
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      },
      
      /* Add custom animations for health-focused interactions */
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "bounce-soft": "bounceSoft 0.6s ease-out",
        "pulse-primary": "pulsePrimary 2s infinite",
        "wiggle": "wiggle 1s ease-in-out infinite"
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceSoft: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
          '40%, 43%': { transform: 'translateY(-8px)' },
          '70%': { transform: 'translateY(-4px)' },
          '90%': { transform: 'translateY(-2px)' }
        },
        pulsePrimary: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        }
      },
      
      /* Custom utility classes for health-focused design */
      utilities: {
        '.health-gradient-primary': {
          background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))'
        },
        '.health-gradient-secondary': {
          background: 'linear-gradient(135deg, var(--color-secondary-500), var(--color-secondary-600))'
        },
        '.health-card': {
          'background-color': 'var(--color-card)',
          'border': '1px solid var(--color-border)',
          'border-radius': 'var(--radius-lg)',
          'box-shadow': 'var(--shadow-sm)'
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': 'var(--color-muted-foreground) transparent'
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      }
    }
  },
  plugins: [
    /* Add plugins for enhanced functionality */
    require('@tailwindcss/forms')({
      strategy: 'class' // Use class-based form styling
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    
    /* Custom plugin for health-specific utilities */
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        '.nutrition-badge': {
          '@apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium': {},
          'background-color': 'var(--color-primary-100)',
          'color': 'var(--color-primary-800)'
        },
        '.inflammation-positive': {
          'color': 'var(--color-error-600)',
          'background-color': 'var(--color-error-50)'
        },
        '.inflammation-neutral': {
          'color': 'var(--color-warning-600)', 
          'background-color': 'var(--color-warning-50)'
        },
        '.inflammation-negative': {
          'color': 'var(--color-success-600)',
          'background-color': 'var(--color-success-50)'
        },
        '.difficulty-easy': {
          'color': 'var(--color-success-700)',
          'background-color': 'var(--color-success-100)'
        },
        '.difficulty-medium': {
          'color': 'var(--color-warning-700)',
          'background-color': 'var(--color-warning-100)'
        },
        '.difficulty-hard': {
          'color': 'var(--color-error-700)',
          'background-color': 'var(--color-error-100)'
        }
      }
      
      addUtilities(newUtilities)
    }
  ]
}

export default config