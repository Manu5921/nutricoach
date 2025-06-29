'use client'

import { usePathname } from 'next/navigation'
import { StructuredData } from './StructuredData'
import { schemaData } from './StructuredData'

interface DynamicSEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article' | 'product' | 'recipe'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  canonicalUrl?: string
  noindex?: boolean
  recipe?: RecipeData
  faq?: FAQData[]
  breadcrumbs?: BreadcrumbData[]
}

interface RecipeData {
  name: string
  description: string
  image: string
  prepTime: string
  cookTime: string
  totalTime: string
  recipeYield: string
  recipeCategory: string
  recipeCuisine: string
  ingredients: string[]
  instructions: string[]
  nutrition?: {
    calories: string
    protein: string
    carbs: string
    fat: string
    fiber?: string
    sugar?: string
  }
  rating?: {
    value: number
    count: number
  }
}

interface FAQData {
  question: string
  answer: string
}

interface BreadcrumbData {
  name: string
  url: string
}

export function DynamicSEO({
  title,
  description,
  keywords = [],
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  canonicalUrl,
  noindex = false,
  recipe,
  faq,
  breadcrumbs
}: DynamicSEOProps) {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nutricoach-production.up.railway.app'
  
  // Generate dynamic content based on page
  const pageSEOConfig = getPageSEOConfig(pathname)
  
  const finalTitle = title || pageSEOConfig.title
  const finalDescription = description || pageSEOConfig.description
  const finalKeywords = keywords.length > 0 ? keywords : pageSEOConfig.keywords
  const finalImage = image || pageSEOConfig.image || '/og-image.jpg'
  const fullImageUrl = finalImage.startsWith('http') ? finalImage : `${baseUrl}${finalImage}`
  const canonicalFullUrl = canonicalUrl || `${baseUrl}${pathname}`

  // Generate enhanced meta tags
  const metaTags = generateMetaTags({
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    image: fullImageUrl,
    canonicalUrl: canonicalFullUrl,
    type,
    publishedTime,
    modifiedTime,
    author,
    section,
    noindex
  })

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords.join(', ')} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'} />
      <link rel="canonical" href={canonicalFullUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
      <meta property="og:url" content={canonicalFullUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="NutriCoach" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalFullUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={finalTitle} />
      <meta name="twitter:creator" content="@nutricoach" />
      <meta name="twitter:site" content="@nutricoach" />
      
      {/* Article specific meta */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
        </>
      )}
      
      {/* Enhanced meta for better SEO */}
      <meta name="author" content={author || 'NutriCoach'} />
      <meta name="publisher" content="NutriCoach" />
      <meta name="language" content="French" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="web" />
      <meta name="rating" content="general" />
      
      {/* Mobile optimization */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="NutriCoach" />
      
      {/* Structured Data */}
      <StructuredData type="WebSite" data={schemaData.website} />
      <StructuredData type="Organization" data={schemaData.organization} />
      <StructuredData type="SoftwareApplication" data={schemaData.softwareApplication} />
      
      {/* Recipe Schema */}
      {recipe && (
        <StructuredData 
          type="Recipe" 
          data={{
            name: recipe.name,
            description: recipe.description,
            image: recipe.image,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            totalTime: recipe.totalTime,
            recipeYield: recipe.recipeYield,
            recipeCategory: recipe.recipeCategory,
            recipeCuisine: recipe.recipeCuisine,
            recipeIngredient: recipe.ingredients,
            recipeInstructions: recipe.instructions.map((instruction, index) => ({
              '@type': 'HowToStep',
              name: `Étape ${index + 1}`,
              text: instruction
            })),
            author: {
              '@type': 'Organization',
              name: 'NutriCoach'
            },
            datePublished: publishedTime,
            ...(recipe.nutrition && {
              nutrition: {
                '@type': 'NutritionInformation',
                calories: recipe.nutrition.calories,
                proteinContent: recipe.nutrition.protein,
                carbohydrateContent: recipe.nutrition.carbs,
                fatContent: recipe.nutrition.fat,
                fiberContent: recipe.nutrition.fiber,
                sugarContent: recipe.nutrition.sugar
              }
            }),
            ...(recipe.rating && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: recipe.rating.value,
                reviewCount: recipe.rating.count
              }
            })
          }} 
        />
      )}
      
      {/* FAQ Schema */}
      {faq && faq.length > 0 && (
        <StructuredData 
          type="FAQPage" 
          data={{
            mainEntity: faq.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
              }
            }))
          }} 
        />
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <StructuredData 
          type="BreadcrumbList" 
          data={{
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
            }))
          }} 
        />
      )}
      
      {/* Local Business Schema for location-specific pages */}
      {pathname.includes('local') || pathname.includes('france') && (
        <StructuredData 
          type="LocalBusiness" 
          data={{
            '@type': 'HealthAndBeautyBusiness',
            name: 'NutriCoach France',
            description: 'Service de nutrition anti-inflammatoire personnalisée par IA en France',
            url: baseUrl,
            image: `${baseUrl}/logo.png`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Paris',
              addressCountry: 'FR'
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 48.8566,
              longitude: 2.3522
            },
            openingHours: 'Mo-Su 00:00-23:59',
            telephone: '+33-1-23-45-67-89',
            priceRange: '€€',
            acceptsReservations: true,
            servesCuisine: 'Healthy',
            areaServed: {
              '@type': 'Country',
              name: 'France'
            }
          }} 
        />
      )}
      
      {/* JSON-LD for WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: finalTitle,
            description: finalDescription,
            url: canonicalFullUrl,
            image: fullImageUrl,
            author: {
              '@type': 'Organization',
              name: 'NutriCoach'
            },
            publisher: {
              '@type': 'Organization',
              name: 'NutriCoach',
              logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/logo.png`
              }
            },
            datePublished: publishedTime,
            dateModified: modifiedTime || publishedTime,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalFullUrl
            },
            inLanguage: 'fr-FR',
            isPartOf: {
              '@type': 'WebSite',
              name: 'NutriCoach',
              url: baseUrl
            }
          })
        }}
      />
    </>
  )
}

// Page-specific SEO configurations
function getPageSEOConfig(pathname: string) {
  const configs: Record<string, any> = {
    '/': {
      title: 'NutriCoach - Nutrition Anti-Inflammatoire Personnalisée par IA',
      description: 'Transformez votre alimentation avec des recettes personnalisées anti-inflammatoires, des conseils nutritionnels adaptatifs et un suivi complet par IA. 6,99€/mois sans engagement.',
      keywords: [
        'nutrition anti-inflammatoire',
        'recettes IA personnalisées',
        'coach nutrition en ligne',
        'alimentation santé France',
        'régime anti-inflammatoire',
        'intelligence artificielle nutrition',
        'application nutrition française',
        'suivi nutritionnel personnalisé'
      ],
      image: '/og-home.jpg'
    },
    '/pricing': {
      title: 'Tarifs NutriCoach - 6,99€/mois | Nutrition Anti-Inflammatoire par IA',
      description: 'Plans d\'abonnement transparents pour accéder à la nutrition anti-inflammatoire personnalisée. 6,99€/mois, sans engagement, garantie 30 jours satisfait ou remboursé.',
      keywords: [
        'prix nutricoach',
        'abonnement nutrition IA',
        'tarif coach nutrition',
        'nutrition anti-inflammatoire prix',
        'application nutrition française tarif',
        'abonnement alimentaire personnalisé'
      ],
      image: '/og-pricing.jpg'
    },
    '/menu/generate': {
      title: 'Générateur de Menus Anti-Inflammatoires | IA Nutrition NutriCoach',
      description: 'Générez instantanément des menus personnalisés anti-inflammatoires avec notre IA spécialisée. Plus de 500 recettes validées par des nutritionnistes.',
      keywords: [
        'générateur menu anti-inflammatoire',
        'menu personnalisé IA nutrition',
        'recettes anti-inflammatoires automatiques',
        'planning repas intelligent',
        'menu adapté besoins nutritionnels',
        'génération automatique repas sains'
      ],
      image: '/og-menu-generator.jpg'
    },
    '/login': {
      title: 'Connexion - Accédez à votre tableau de bord NutriCoach',
      description: 'Connectez-vous à votre compte NutriCoach pour accéder à vos menus personnalisés, suivi nutritionnel et recommandations IA.',
      keywords: ['connexion nutricoach', 'login nutrition', 'accès compte'],
      image: '/og-login.jpg'
    },
    '/signup': {
      title: 'Inscription NutriCoach - Commencez votre transformation nutritionnelle',
      description: 'Créez votre compte NutriCoach et commencez votre parcours vers une nutrition anti-inflammatoire personnalisée par IA. Inscription gratuite.',
      keywords: [
        'inscription nutricoach',
        'créer compte nutrition',
        'démarrer nutrition anti-inflammatoire',
        'inscription gratuite nutrition IA'
      ],
      image: '/og-signup.jpg'
    },
    '/legal': {
      title: 'Mentions Légales - NutriCoach France',
      description: 'Mentions légales, informations sur l\'entreprise NutriCoach et conditions d\'utilisation de la plateforme de nutrition anti-inflammatoire.',
      keywords: ['mentions légales nutricoach', 'informations légales'],
      image: '/og-legal.jpg'
    },
    '/privacy': {
      title: 'Politique de Confidentialité - Protection des données NutriCoach',
      description: 'Notre engagement pour la protection de vos données personnelles et de santé. Politique RGPD complète et transparente.',
      keywords: ['confidentialité nutricoach', 'RGPD nutrition', 'protection données santé'],
      image: '/og-privacy.jpg'
    },
    '/terms': {
      title: 'Conditions d\'Utilisation - Service NutriCoach',
      description: 'Conditions générales d\'utilisation du service de nutrition anti-inflammatoire personnalisée NutriCoach.',
      keywords: ['conditions utilisation nutricoach', 'CGU nutrition'],
      image: '/og-terms.jpg'
    },
    '/cookies': {
      title: 'Politique des Cookies - Gestion et préférences NutriCoach',
      description: 'Informations sur l\'utilisation des cookies sur NutriCoach et gestion de vos préférences de confidentialité.',
      keywords: ['cookies nutricoach', 'gestion cookies nutrition'],
      image: '/og-cookies.jpg'
    }
  }
  
  return configs[pathname] || configs['/']
}

// Generate meta tags object for server components
export function generateMetaTags({
  title,
  description,
  keywords,
  image,
  canonicalUrl,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  noindex = false
}: {
  title: string
  description: string
  keywords: string[]
  image: string
  canonicalUrl: string
  type?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  noindex?: boolean
}) {
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : [{ name: 'NutriCoach' }],
    robots: noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    canonical: canonicalUrl,
    
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'NutriCoach',
      images: [
        {
          url: image,
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
      images: [image],
      creator: '@nutricoach',
      site: '@nutricoach',
    },
    
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'fr-FR': canonicalUrl,
      },
    },
    
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'NutriCoach',
      'application-name': 'NutriCoach',
      'msapplication-TileColor': '#16a34a',
      'theme-color': '#16a34a',
      'format-detection': 'telephone=no',
      'revisit-after': '7 days',
      'distribution': 'web',
      'rating': 'general',
      'language': 'French',
      'publisher': 'NutriCoach',
    },
  }
}

export default DynamicSEO