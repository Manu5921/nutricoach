/**
 * Tailwind CSS Configuration Variants
 * Extensible Tailwind configurations for different project types and themes
 */

import type { Config } from 'tailwindcss';

/**
 * Base Tailwind configuration
 */
export const tailwindConfigBase: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        
        // Semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        
        // Neutral grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-light': 'bounceLlight 1s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      
      screens: {
        xs: '475px',
        '3xl': '1600px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
};

/**
 * Nutrition-themed configuration
 */
export const tailwindConfigNutrition: Config = {
  ...tailwindConfigBase,
  theme: {
    ...tailwindConfigBase.theme,
    extend: {
      ...tailwindConfigBase.theme?.extend,
      colors: {
        ...tailwindConfigBase.theme?.extend?.colors,
        
        // Nutrition-specific colors
        nutrition: {
          protein: {
            50: '#fef7ed',
            100: '#fdedd3',
            200: '#fbd7a5',
            300: '#f8bc6d',
            400: '#f49332',
            500: '#f1720a',
            600: '#e25705',
            700: '#bb4108',
            800: '#953410',
            900: '#782c10',
            950: '#411406',
          },
          carbs: {
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
            950: '#431407',
          },
          fat: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
            950: '#422006',
          },
          fiber: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
            950: '#052e16',
          },
          calories: {
            50: '#fdf2f8',
            100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f9a8d4',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
            800: '#9d174d',
            900: '#831843',
            950: '#500724',
          },
        },
        
        // Health status colors
        health: {
          excellent: '#10b981',
          good: '#84cc16',
          fair: '#f59e0b',
          poor: '#ef4444',
        },
      },
    },
  },
};

/**
 * Economics-themed configuration
 */
export const tailwindConfigEconomics: Config = {
  ...tailwindConfigBase,
  theme: {
    ...tailwindConfigBase.theme,
    extend: {
      ...tailwindConfigBase.theme?.extend,
      colors: {
        ...tailwindConfigBase.theme?.extend?.colors,
        
        // Economics-specific colors
        economics: {
          bullish: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
            950: '#052e16',
          },
          bearish: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
            950: '#450a0a',
          },
          neutral: {
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
        },
        
        // Financial instruments
        financial: {
          stocks: '#3b82f6',
          bonds: '#8b5cf6',
          crypto: '#f59e0b',
          commodities: '#84cc16',
          forex: '#06b6d4',
          real_estate: '#10b981',
        },
      },
    },
  },
};

/**
 * Dark mode configuration
 */
export const tailwindConfigDark: Config = {
  ...tailwindConfigBase,
  darkMode: 'class',
  theme: {
    ...tailwindConfigBase.theme,
    extend: {
      ...tailwindConfigBase.theme?.extend,
      colors: {
        ...tailwindConfigBase.theme?.extend?.colors,
        
        // Dark mode specific colors
        dark: {
          50: '#1f2937',
          100: '#111827',
          200: '#0f172a',
          300: '#0c1220',
          400: '#090e1a',
          500: '#070b14',
          600: '#05080f',
          700: '#030609',
          800: '#020404',
          900: '#010202',
        },
      },
    },
  },
};

/**
 * Component library configuration
 */
export const tailwindConfigComponents: Config = {
  ...tailwindConfigBase,
  theme: {
    ...tailwindConfigBase.theme,
    extend: {
      ...tailwindConfigBase.theme?.extend,
      
      // Component-specific utilities
      backdropBlur: {
        xs: '2px',
      },
      
      transitionProperty: {
        width: 'width',
        spacing: 'margin, padding',
      },
      
      // Component variants
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(0, 0, 0, 0.1)',
      },
      
      backdropBlur: {
        'glass': '10px',
      },
    },
  },
};

/**
 * Mobile-first configuration
 */
export const tailwindConfigMobile: Config = {
  ...tailwindConfigBase,
  theme: {
    ...tailwindConfigBase.theme,
    extend: {
      ...tailwindConfigBase.theme?.extend,
      
      // Mobile-optimized spacing
      spacing: {
        ...tailwindConfigBase.theme?.extend?.spacing,
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      // Touch-friendly sizes
      minHeight: {
        'touch': '44px',
      },
      
      minWidth: {
        'touch': '44px',
      },
    },
  },
};

/**
 * Print-optimized configuration
 */
export const tailwindConfigPrint: Config = {
  ...tailwindConfigBase,
  theme: {
    ...tailwindConfigBase.theme,
    extend: {
      ...tailwindConfigBase.theme?.extend,
      
      // Print-specific utilities
      screens: {
        ...tailwindConfigBase.theme?.extend?.screens,
        print: { raw: 'print' },
      },
      
      colors: {
        ...tailwindConfigBase.theme?.extend?.colors,
        print: {
          black: '#000000',
          white: '#ffffff',
          gray: '#666666',
        },
      },
    },
  },
};

/**
 * Function to create custom Tailwind config
 */
export function createTailwindConfig(
  type: 'base' | 'nutrition' | 'economics' | 'dark' | 'components' | 'mobile' | 'print',
  customOptions?: Partial<Config>
): Config {
  const configs = {
    base: tailwindConfigBase,
    nutrition: tailwindConfigNutrition,
    economics: tailwindConfigEconomics,
    dark: tailwindConfigDark,
    components: tailwindConfigComponents,
    mobile: tailwindConfigMobile,
    print: tailwindConfigPrint,
  };

  const baseConfig = configs[type];
  
  if (!customOptions) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    content: [...(baseConfig.content || []), ...(customOptions.content || [])],
    theme: {
      ...baseConfig.theme,
      extend: {
        ...baseConfig.theme?.extend,
        ...customOptions.theme?.extend,
      },
    },
    plugins: [...(baseConfig.plugins || []), ...(customOptions.plugins || [])],
    ...customOptions,
  };
}

/**
 * Preset configurations for different project contexts
 */
export const tailwindPresets = {
  // Full-featured configuration for web applications
  webapp: createTailwindConfig('base', {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  }),
  
  // Component library configuration
  library: createTailwindConfig('components', {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
      './stories/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  }),
  
  // Nutrition app preset
  nutrition: createTailwindConfig('nutrition', {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  }),
  
  // Economics app preset
  economics: createTailwindConfig('economics', {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  }),
  
  // Mobile app preset
  mobile: createTailwindConfig('mobile', {
    content: [
      './src/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
  }),
};

/**
 * Export all configurations
 */
export const tailwindConfigs = {
  base: tailwindConfigBase,
  nutrition: tailwindConfigNutrition,
  economics: tailwindConfigEconomics,
  dark: tailwindConfigDark,
  components: tailwindConfigComponents,
  mobile: tailwindConfigMobile,
  print: tailwindConfigPrint,
  presets: tailwindPresets,
};