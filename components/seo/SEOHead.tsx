import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  noindex?: boolean
  canonical?: string
}

export function generateSEOMetadata({
  title = 'NutriCoach - Nutrition Anti-Inflammatoire Personnalisée par IA',
  description = 'Transformez votre alimentation avec des recettes personnalisées, des conseils nutritionnels adaptatifs et un suivi complet de votre bien-être. L\'intelligence artificielle au service de votre santé.',
  keywords = [
    'nutrition anti-inflammatoire',
    'recettes personnalisées',
    'intelligence artificielle nutrition',
    'suivi nutritionnel',
    'alimentation santé',
    'régime anti-inflammatoire',
    'IA nutrition',
    'conseils nutritionnels',
    'bien-être alimentaire',
    'recettes saines'
  ],
  image = '/og-image.jpg',
  url = 'https://nutricoach-production.up.railway.app',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  noindex = false,
  canonical,
}: SEOProps = {}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nutricoach-production.up.railway.app'
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : [{ name: 'NutriCoach' }],
    robots: noindex ? 'noindex,nofollow' : 'index,follow',
    canonical: canonical || fullUrl,
    
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'NutriCoach',
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'fr_FR',
      type: type === 'article' ? 'article' : 'website',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
      creator: '@nutricoach',
      site: '@nutricoach',
    },
    
    alternates: {
      canonical: canonical || fullUrl,
      languages: {
        'fr-FR': fullUrl,
      },
    },
    
    // Additional SEO optimizations
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'NutriCoach',
      'application-name': 'NutriCoach',
      'msapplication-TileColor': '#16a34a',
      'theme-color': '#16a34a',
    },
  }
}

// Predefined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: 'NutriCoach - Nutrition Anti-Inflammatoire Personnalisée par IA',
    description: 'Transformez votre alimentation avec des recettes personnalisées, des conseils nutritionnels adaptatifs et un suivi complet de votre bien-être. L\'intelligence artificielle au service de votre santé.',
    keywords: [
      'nutrition anti-inflammatoire',
      'recettes personnalisées IA',
      'intelligence artificielle nutrition',
      'suivi nutritionnel',
      'alimentation santé',
      'régime anti-inflammatoire',
      'conseils nutritionnels personnalisés',
      'bien-être alimentaire',
      'application nutrition',
      'menus personnalisés'
    ],
  },
  
  dashboard: {
    title: 'Dashboard - Suivi Nutritionnel Personnalisé | NutriCoach',
    description: 'Accédez à votre tableau de bord personnalisé avec suivi nutritionnel, recommandations IA et analyse de vos progrès en nutrition anti-inflammatoire.',
    keywords: [
      'dashboard nutrition',
      'suivi nutritionnel',
      'tableau de bord santé',
      'analyse nutritionnelle',
      'progrès alimentation',
      'métriques nutrition'
    ],
    noindex: true, // Private user area
  },
  
  pricing: {
    title: 'Tarifs et Abonnements - Plans NutriCoach',
    description: 'Découvrez nos plans d\'abonnement pour accéder à la nutrition anti-inflammatoire personnalisée par IA. Tarifs transparents à partir de 6,99€/mois.',
    keywords: [
      'tarifs nutricoach',
      'abonnement nutrition',
      'prix consultation nutritionnelle',
      'plan nutrition IA',
      'abonnement alimentaire',
      'cout nutrition personnalisée'
    ],
  },
  
  menuGenerate: {
    title: 'Générateur de Menus Anti-Inflammatoires | NutriCoach',
    description: 'Générez instantanément des menus personnalisés anti-inflammatoires adaptés à vos besoins nutritionnels avec notre IA spécialisée.',
    keywords: [
      'générateur menu anti-inflammatoire',
      'menu personnalisé IA',
      'recettes anti-inflammatoires',
      'planning repas santé',
      'menu adapté nutrition',
      'génération automatique menu'
    ],
  },
  
  profile: {
    title: 'Mon Profil Nutritionnel | NutriCoach',
    description: 'Gérez votre profil nutritionnel, vos préférences alimentaires et objectifs de santé pour des recommandations IA toujours plus précises.',
    keywords: [
      'profil nutritionnel',
      'préférences alimentaires',
      'objectifs nutrition',
      'restrictions alimentaires',
      'personnalisation IA'
    ],
    noindex: true, // Private user area
  },
} as const