'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  name: string
  href: string
  current?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
  separator?: string
  maxItems?: number
}

// Predefined breadcrumb configurations for common pages
const breadcrumbConfigs: Record<string, BreadcrumbItem[]> = {
  '/': [
    { name: 'Accueil', href: '/', current: true }
  ],
  '/pricing': [
    { name: 'Accueil', href: '/' },
    { name: 'Tarifs', href: '/pricing', current: true }
  ],
  '/menu/generate': [
    { name: 'Accueil', href: '/' },
    { name: 'Générateur de Menus', href: '/menu/generate', current: true }
  ],
  '/dashboard': [
    { name: 'Accueil', href: '/' },
    { name: 'Tableau de Bord', href: '/dashboard', current: true }
  ],
  '/profile': [
    { name: 'Accueil', href: '/' },
    { name: 'Mon Profil', href: '/profile', current: true }
  ],
  '/legal': [
    { name: 'Accueil', href: '/' },
    { name: 'Mentions Légales', href: '/legal', current: true }
  ],
  '/privacy': [
    { name: 'Accueil', href: '/' },
    { name: 'Confidentialité', href: '/privacy', current: true }
  ],
  '/terms': [
    { name: 'Accueil', href: '/' },
    { name: 'Conditions d\'Utilisation', href: '/terms', current: true }
  ],
  '/cookies': [
    { name: 'Accueil', href: '/' },
    { name: 'Cookies', href: '/cookies', current: true }
  ]
}

export function Breadcrumbs({
  items,
  className = '',
  showHome = true,
  separator = '/',
  maxItems = 5
}: BreadcrumbsProps) {
  const pathname = usePathname()
  
  // Use provided items or generate from pathname
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname, showHome)
  
  // Limit number of items if specified
  const displayItems = maxItems > 0 && breadcrumbItems.length > maxItems
    ? [
        breadcrumbItems[0],
        { name: '...', href: '#', current: false },
        ...breadcrumbItems.slice(-(maxItems - 2))
      ]
    : breadcrumbItems

  if (!displayItems || displayItems.length <= 1) {
    return null
  }

  return (
    <nav
      className={cn('flex', className)}
      aria-label="Fil d'Ariane"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {displayItems.map((item, index) => (
          <li key={`${item.href}-${index}`} className="inline-flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400 select-none" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {item.current ? (
              <span
                className="text-sm font-medium text-gray-500 truncate max-w-xs"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : item.name === '...' ? (
              <span className="text-sm text-gray-400">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'inline-flex items-center text-sm font-medium transition-colors',
                  'text-gray-700 hover:text-green-600',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded',
                  index === 0 && 'text-green-600 hover:text-green-700'
                )}
              >
                {index === 0 && showHome && (
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                )}
                <span className="truncate max-w-xs">
                  {item.name}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Generate breadcrumbs automatically from pathname
function generateBreadcrumbsFromPath(pathname: string, showHome: boolean): BreadcrumbItem[] {
  // Check if we have a predefined config
  if (breadcrumbConfigs[pathname]) {
    return breadcrumbConfigs[pathname]
  }

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  if (showHome) {
    breadcrumbs.push({ name: 'Accueil', href: '/' })
  }

  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Decode URL segment and format for display
    const name = formatSegmentName(decodeURIComponent(segment))
    
    breadcrumbs.push({
      name,
      href: currentPath,
      current: isLast
    })
  })

  return breadcrumbs
}

// Format URL segment for display
function formatSegmentName(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'menu': 'Menus',
    'generate': 'Générateur',
    'blog': 'Blog',
    'recettes': 'Recettes',
    'categorie': 'Catégorie',
    'admin': 'Administration',
    'analytics': 'Analyses',
    'dashboard': 'Tableau de Bord',
    'profile': 'Profil',
    'settings': 'Paramètres',
    'legal': 'Mentions Légales',
    'privacy': 'Confidentialité',
    'terms': 'Conditions',
    'cookies': 'Cookies',
    'pricing': 'Tarifs',
    'signup': 'Inscription',
    'login': 'Connexion'
  }

  if (specialCases[segment]) {
    return specialCases[segment]
  }

  // Convert kebab-case to title case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Structured data component for breadcrumbs
export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nutricoach-production.up.railway.app'
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${baseUrl}${item.href}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Compact breadcrumb variant for mobile
export function CompactBreadcrumbs({ 
  items,
  className = ''
}: { 
  items?: BreadcrumbItem[]
  className?: string 
}) {
  const pathname = usePathname()
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname, true)
  
  if (!breadcrumbItems || breadcrumbItems.length <= 1) {
    return null
  }

  const currentItem = breadcrumbItems[breadcrumbItems.length - 1]
  const parentItem = breadcrumbItems.length > 1 ? breadcrumbItems[breadcrumbItems.length - 2] : null

  return (
    <nav className={cn('flex items-center', className)} aria-label="Fil d'Ariane compact">
      {parentItem && (
        <Link
          href={parentItem.href}
          className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {parentItem.name}
        </Link>
      )}
      {parentItem && (
        <span className="mx-2 text-gray-400">/</span>
      )}
      <span className="text-sm font-medium text-gray-900 truncate">
        {currentItem.name}
      </span>
    </nav>
  )
}

// Hook for programmatically getting breadcrumb items
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
  const pathname = usePathname()
  
  if (customItems) {
    return customItems
  }
  
  return generateBreadcrumbsFromPath(pathname, true)
}

export default Breadcrumbs