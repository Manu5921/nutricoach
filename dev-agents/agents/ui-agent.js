#!/usr/bin/env node

/**
 * 🎨 UI AGENT - INTERFACE & DESIGN
 * 
 * Spécialisation: Composants React, Tailwind CSS, Design System
 * Responsabilités: Interface utilisateur, UX/UI, Design responsive
 */

import { BaseAgent } from '../lib/base-agent.js';
import chalk from 'chalk';

class UIAgent extends BaseAgent {
  constructor() {
    super({
      id: 'ui-agent',
      name: 'UI Agent',
      specialization: 'Interface & Design',
      color: 'cyan',
      capabilities: [
        'react-components',
        'tailwind-css',
        'radix-ui',
        'shadcn-ui',
        'responsive-design',
        'accessibility',
        'animations',
        'design-system',
        'mobile-first',
        'pwa-setup'
      ],
      dependencies: ['db-agent'], // Attend les types TypeScript de la DB
      outputPaths: {
        components: 'apps/web/components/',
        styles: 'apps/web/styles/',
        assets: 'apps/web/public/',
        stories: 'apps/web/stories/'
      }
    });

    this.designTokens = {
      colors: {
        primary: '#22c55e', // Vert anti-inflammatoire
        secondary: '#f59e0b',
        accent: '#3b82f6',
        neutral: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      typography: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          heading: ['Lexend', 'system-ui', 'sans-serif']
        }
      }
    };
  }

  /**
   * 🎯 TRAITEMENT DES TÂCHES UI
   */
  async processTask(task) {
    this.log(`🎨 Traitement tâche UI: ${task.description}`);

    try {
      switch (task.type) {
        case 'component':
          return await this.createComponent(task);
        case 'page':
          return await this.createPage(task);
        case 'layout':
          return await this.createLayout(task);
        case 'design-system':
          return await this.setupDesignSystem(task);
        case 'responsive':
          return await this.makeResponsive(task);
        case 'accessibility':
          return await this.addAccessibility(task);
        case 'animation':
          return await this.addAnimations(task);
        default:
          throw new Error(`Type de tâche UI non supporté: ${task.type}`);
      }
    } catch (error) {
      this.logError(`Erreur traitement tâche ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * 🧩 CRÉATION DE COMPOSANTS
   */
  async createComponent(task) {
    const { componentName, props, styling, accessibility } = task.spec;
    
    this.log(`🧩 Création composant: ${componentName}`);

    // Générer le code du composant
    const componentCode = this.generateComponentCode(componentName, props, styling, accessibility);
    
    // Générer les types TypeScript
    const typesCode = this.generateComponentTypes(componentName, props);
    
    // Générer les tests
    const testCode = this.generateComponentTests(componentName, props);
    
    // Générer la story Storybook
    const storyCode = this.generateComponentStory(componentName, props);

    const files = [
      {
        path: `${this.config.outputPaths.components}${componentName}/${componentName}.tsx`,
        content: componentCode
      },
      {
        path: `${this.config.outputPaths.components}${componentName}/types.ts`,
        content: typesCode
      },
      {
        path: `${this.config.outputPaths.components}${componentName}/${componentName}.test.tsx`,
        content: testCode
      },
      {
        path: `${this.config.outputPaths.stories}${componentName}.stories.tsx`,
        content: storyCode
      }
    ];

    return {
      success: true,
      files,
      component: componentName,
      exports: [`${componentName}`, `${componentName}Props`],
      documentation: `Composant ${componentName} créé avec accessibilité et responsive design`
    };
  }

  /**
   * 📄 CRÉATION DE PAGES
   */
  async createPage(task) {
    const { pageName, layout, components, routing } = task.spec;
    
    this.log(`📄 Création page: ${pageName}`);

    const pageCode = this.generatePageCode(pageName, layout, components, routing);
    const layoutCode = layout ? this.generateLayoutCode(layout) : null;

    const files = [
      {
        path: `apps/web/app/${pageName.toLowerCase()}/page.tsx`,
        content: pageCode
      }
    ];

    if (layoutCode) {
      files.push({
        path: `apps/web/app/${pageName.toLowerCase()}/layout.tsx`,
        content: layoutCode
      });
    }

    return {
      success: true,
      files,
      page: pageName,
      route: `/${pageName.toLowerCase()}`,
      documentation: `Page ${pageName} créée avec layout et routing Next.js`
    };
  }

  /**
   * 🎨 SETUP DESIGN SYSTEM
   */
  async setupDesignSystem(task) {
    this.log('🎨 Setup Design System');

    const tailwindConfig = this.generateTailwindConfig();
    const cssVariables = this.generateCSSVariables();
    const componentIndex = this.generateComponentIndex();

    const files = [
      {
        path: 'tailwind.config.js',
        content: tailwindConfig
      },
      {
        path: 'apps/web/styles/globals.css',
        content: cssVariables
      },
      {
        path: 'apps/web/components/index.ts',
        content: componentIndex
      }
    ];

    return {
      success: true,
      files,
      designSystem: 'configured',
      tokens: this.designTokens,
      documentation: 'Design System configuré avec Tailwind CSS et tokens personnalisés'
    };
  }

  /**
   * 📱 RESPONSIVE DESIGN
   */
  async makeResponsive(task) {
    const { target, breakpoints } = task.spec;
    
    this.log(`📱 Optimisation responsive: ${target}`);

    // Analyser le composant/page existant
    const analysis = await this.analyzeResponsiveness(target);
    
    // Générer les améliorations responsive
    const improvements = this.generateResponsiveImprovements(analysis, breakpoints);

    return {
      success: true,
      target,
      improvements,
      breakpoints: breakpoints || ['sm', 'md', 'lg', 'xl', '2xl'],
      documentation: `Optimisation responsive appliquée à ${target}`
    };
  }

  /**
   * ♿ ACCESSIBILITÉ
   */
  async addAccessibility(task) {
    const { target, wcagLevel = 'AA' } = task.spec;
    
    this.log(`♿ Amélioration accessibilité: ${target} (WCAG ${wcagLevel})`);

    const a11yImprovements = this.generateA11yImprovements(target, wcagLevel);

    return {
      success: true,
      target,
      wcagLevel,
      improvements: a11yImprovements,
      documentation: `Accessibilité WCAG ${wcagLevel} appliquée à ${target}`
    };
  }

  /**
   * ✨ ANIMATIONS
   */
  async addAnimations(task) {
    const { target, animationType, duration = 300 } = task.spec;
    
    this.log(`✨ Ajout animations: ${target}`);

    const animations = this.generateAnimations(target, animationType, duration);

    return {
      success: true,
      target,
      animations,
      documentation: `Animations ${animationType} ajoutées à ${target}`
    };
  }

  /**
   * 🏗️ GÉNÉRATEURS DE CODE
   */
  generateComponentCode(name, props, styling, accessibility) {
    return `import React from 'react';
import { cn } from '@/lib/utils';
import { ${name}Props } from './types';

export const ${name}: React.FC<${name}Props> = ({
  ${props.map(p => p.name).join(',\n  ')},
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "${styling.baseClasses || 'p-4 rounded-lg'}",
        className
      )}
      ${accessibility.ariaLabel ? `aria-label="${accessibility.ariaLabel}"` : ''}
      ${accessibility.role ? `role="${accessibility.role}"` : ''}
      {...props}
    >
      {/* Contenu du composant */}
    </div>
  );
};

${name}.displayName = '${name}';
`;
  }

  generateComponentTypes(name, props) {
    return `export interface ${name}Props {
  ${props.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n  ')}
  className?: string;
  children?: React.ReactNode;
}
`;
  }

  generateComponentTests(name, props) {
    return `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders correctly', () => {
    render(<${name} />);
    expect(screen.getByRole('${name.toLowerCase()}')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<${name} className="custom-class" />);
    expect(screen.getByRole('${name.toLowerCase()}')).toHaveClass('custom-class');
  });
});
`;
  }

  generateComponentStory(name, props) {
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // props par défaut
  },
};
`;
  }

  generatePageCode(pageName, layout, components, routing) {
    return `import { Metadata } from 'next';
${components.map(c => `import { ${c} } from '@/components/${c}';`).join('\n')}

export const metadata: Metadata = {
  title: '${pageName} | NutriCoach',
  description: 'Page ${pageName} de l\\'application NutriCoach',
};

export default function ${pageName}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">${pageName}</h1>
      ${components.map(c => `<${c} />`).join('\n      ')}
    </div>
  );
}
`;
  }

  generateTailwindConfig() {
    return `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(this.designTokens.colors, null, 8)},
      spacing: ${JSON.stringify(this.designTokens.spacing, null, 8)},
      fontFamily: ${JSON.stringify(this.designTokens.typography.fontFamily, null, 8)},
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};

export default config;
`;
  }

  generateCSSVariables() {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colors */
  --color-primary: ${this.designTokens.colors.primary};
  --color-secondary: ${this.designTokens.colors.secondary};
  --color-accent: ${this.designTokens.colors.accent};
  
  /* Spacing */
  --spacing-xs: ${this.designTokens.spacing.xs};
  --spacing-sm: ${this.designTokens.spacing.sm};
  --spacing-md: ${this.designTokens.spacing.md};
  --spacing-lg: ${this.designTokens.spacing.lg};
}

@layer base {
  html {
    font-family: var(--font-sans);
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-primary text-white hover:bg-primary/90 focus:ring-primary;
  }
}
`;
  }

  generateComponentIndex() {
    return `// Composants UI de base
export { Button } from './ui/Button';
export { Input } from './ui/Input';
export { Card } from './ui/Card';
export { Modal } from './ui/Modal';

// Composants spécialisés
export { RecipeCard } from './recipe/RecipeCard';
export { MenuPlanner } from './menu/MenuPlanner';
export { NutritionChart } from './charts/NutritionChart';

// Layout
export { Header } from './layout/Header';
export { Footer } from './layout/Footer';
export { Sidebar } from './layout/Sidebar';
`;
  }

  // Méthodes d'analyse et d'amélioration
  async analyzeResponsiveness(target) {
    return {
      hasResponsiveClasses: false,
      breakpointsCovered: [],
      improvements: []
    };
  }

  generateResponsiveImprovements(analysis, breakpoints) {
    return [
      'Ajout des classes responsive pour mobile',
      'Optimisation des grilles pour tablette',
      'Adaptation du layout pour desktop'
    ];
  }

  generateA11yImprovements(target, wcagLevel) {
    return [
      'Ajout des attributs ARIA',
      'Amélioration du contraste des couleurs',
      'Support navigation clavier',
      'Labels descriptifs pour les formulaires'
    ];
  }

  generateAnimations(target, type, duration) {
    return {
      type,
      duration,
      classes: ['transition-all', `duration-${duration}`],
      keyframes: {}
    };
  }
}

export { UIAgent };

// Usage CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new UIAgent();
  
  const exampleTask = {
    id: 'ui-recipe-card',
    type: 'component',
    description: 'Créer le composant RecipeCard',
    spec: {
      componentName: 'RecipeCard',
      props: [
        { name: 'title', type: 'string', optional: false },
        { name: 'image', type: 'string', optional: true },
        { name: 'cookingTime', type: 'number', optional: false },
        { name: 'difficulty', type: 'string', optional: false }
      ],
      styling: {
        baseClasses: 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
      },
      accessibility: {
        ariaLabel: 'Recipe card',
        role: 'article'
      }
    }
  };

  agent.processTask(exampleTask)
    .then(result => {
      console.log('✅ Composant créé:', result);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
    });
}