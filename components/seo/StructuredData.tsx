'use client'

interface StructuredDataProps {
  type: 'WebSite' | 'Organization' | 'SoftwareApplication' | 'Article' | 'Recipe' | 'NutritionInformation'
  data: Record<string, any>
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const generateSchema = () => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    }

    // Add specific schema enhancements based on type
    switch (type) {
      case 'WebSite':
        return {
          ...baseSchema,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${data.url}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        }

      case 'Organization':
        return {
          ...baseSchema,
          '@type': 'Organization',
          sameAs: [
            'https://twitter.com/nutricoach',
            'https://www.linkedin.com/company/nutricoach',
            'https://www.facebook.com/nutricoach',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+33-1-23-45-67-89',
            contactType: 'Customer Service',
            availableLanguage: 'French',
          },
        }

      case 'SoftwareApplication':
        return {
          ...baseSchema,
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '6.99',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '1250',
          },
        }

      case 'Recipe':
        return {
          ...baseSchema,
          '@type': 'Recipe',
          recipeCategory: 'Anti-inflammatory',
          recipeCuisine: 'Healthy',
          nutrition: {
            '@type': 'NutritionInformation',
            calories: data.calories || '0 calories',
            carbohydrateContent: data.carbs || '0g',
            proteinContent: data.protein || '0g',
            fatContent: data.fat || '0g',
          },
        }

      default:
        return baseSchema
    }
  }

  const schema = generateSchema()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Predefined schema data for common pages
export const schemaData = {
  website: {
    name: 'NutriCoach',
    url: 'https://nutricoach-production.up.railway.app',
    description: 'Nutrition anti-inflammatoire personnalisée par intelligence artificielle',
    publisher: {
      '@type': 'Organization',
      name: 'NutriCoach',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nutricoach-production.up.railway.app/logo.png',
      },
    },
  },
  
  organization: {
    name: 'NutriCoach',
    url: 'https://nutricoach-production.up.railway.app',
    logo: 'https://nutricoach-production.up.railway.app/logo.png',
    description: 'Plateforme de nutrition anti-inflammatoire personnalisée par IA',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Paris',
      addressCountry: 'FR',
    },
  },
  
  softwareApplication: {
    name: 'NutriCoach',
    description: 'Application de nutrition anti-inflammatoire personnalisée par intelligence artificielle',
    url: 'https://nutricoach-production.up.railway.app',
    author: {
      '@type': 'Organization',
      name: 'NutriCoach',
    },
    screenshot: 'https://nutricoach-production.up.railway.app/images/app-screenshot.jpg',
    featureList: [
      'Recettes personnalisées anti-inflammatoires',
      'Suivi nutritionnel intelligent',
      'Recommandations par IA',
      'Plus de 500 recettes validées',
      'Tableaux de bord complets',
    ],
  },
} as const