'use client'

interface StructuredDataProps {
  type: 'WebSite' | 'Organization' | 'SoftwareApplication' | 'Article' | 'Recipe' | 'NutritionInformation' | 'FAQPage' | 'BreadcrumbList' | 'LocalBusiness' | 'Review' | 'Product' | 'VideoObject' | 'HowTo'
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
          recipeCategory: data.recipeCategory || 'Anti-inflammatory',
          recipeCuisine: data.recipeCuisine || 'Healthy',
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          totalTime: data.totalTime,
          recipeYield: data.recipeYield,
          recipeIngredient: data.recipeIngredient || [],
          recipeInstructions: data.recipeInstructions || [],
          author: data.author || {
            '@type': 'Organization',
            name: 'NutriCoach'
          },
          datePublished: data.datePublished,
          keywords: data.keywords,
          nutrition: {
            '@type': 'NutritionInformation',
            calories: data.calories || data.nutrition?.calories || '0 calories',
            carbohydrateContent: data.carbs || data.nutrition?.carbohydrateContent || '0g',
            proteinContent: data.protein || data.nutrition?.proteinContent || '0g',
            fatContent: data.fat || data.nutrition?.fatContent || '0g',
            fiberContent: data.nutrition?.fiberContent,
            sugarContent: data.nutrition?.sugarContent,
            sodiumContent: data.nutrition?.sodiumContent,
          },
          aggregateRating: data.aggregateRating,
          video: data.video,
          suitableForDiet: data.suitableForDiet || ['https://schema.org/AntiInflammatoryDiet'],
        }

      case 'FAQPage':
        return {
          ...baseSchema,
          '@type': 'FAQPage',
          mainEntity: data.mainEntity || []
        }

      case 'BreadcrumbList':
        return {
          ...baseSchema,
          '@type': 'BreadcrumbList',
          itemListElement: data.itemListElement || []
        }

      case 'LocalBusiness':
        return {
          ...baseSchema,
          '@type': data['@type'] || 'LocalBusiness',
          address: data.address,
          geo: data.geo,
          openingHours: data.openingHours,
          telephone: data.telephone,
          priceRange: data.priceRange,
          acceptsReservations: data.acceptsReservations,
          servesCuisine: data.servesCuisine,
          areaServed: data.areaServed,
          hasMenu: data.hasMenu,
          paymentAccepted: data.paymentAccepted || ['Cash', 'Credit Card'],
          aggregateRating: data.aggregateRating,
          review: data.review,
        }

      case 'Review':
        return {
          ...baseSchema,
          '@type': 'Review',
          reviewBody: data.reviewBody,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: data.reviewRating?.ratingValue,
            bestRating: data.reviewRating?.bestRating || 5,
            worstRating: data.reviewRating?.worstRating || 1
          },
          author: data.author || {
            '@type': 'Person',
            name: 'Utilisateur NutriCoach'
          },
          datePublished: data.datePublished,
          itemReviewed: data.itemReviewed
        }

      case 'Product':
        return {
          ...baseSchema,
          '@type': 'Product',
          brand: data.brand || {
            '@type': 'Brand',
            name: 'NutriCoach'
          },
          sku: data.sku,
          gtin: data.gtin,
          category: data.category,
          offers: {
            '@type': 'Offer',
            price: data.price || '6.99',
            priceCurrency: data.priceCurrency || 'EUR',
            availability: data.availability || 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'NutriCoach'
            },
            validFrom: data.validFrom,
            validThrough: data.validThrough
          },
          aggregateRating: data.aggregateRating,
          review: data.review
        }

      case 'VideoObject':
        return {
          ...baseSchema,
          '@type': 'VideoObject',
          uploadDate: data.uploadDate,
          duration: data.duration,
          contentUrl: data.contentUrl,
          embedUrl: data.embedUrl,
          thumbnailUrl: data.thumbnailUrl,
          transcript: data.transcript,
          interactionStatistic: data.interactionStatistic
        }

      case 'HowTo':
        return {
          ...baseSchema,
          '@type': 'HowTo',
          totalTime: data.totalTime,
          prepTime: data.prepTime,
          performTime: data.performTime,
          supply: data.supply || [],
          tool: data.tool || [],
          step: data.step || [],
          video: data.video,
          yield: data.yield
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

  // FAQ Schema for homepage
  faqPage: {
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Qu\'est-ce que la nutrition anti-inflammatoire ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La nutrition anti-inflammatoire est une approche alimentaire qui privilégie les aliments riches en antioxydants et oméga-3 tout en évitant les aliments pro-inflammatoires. Elle aide à réduire l\'inflammation chronique dans le corps.'
        }
      },
      {
        '@type': 'Question',
        name: 'Comment l\'IA personnalise-t-elle mes menus ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Notre intelligence artificielle analyse vos préférences alimentaires, restrictions, objectifs de santé et réactions aux aliments pour créer des menus uniques adaptés à vos besoins spécifiques.'
        }
      },
      {
        '@type': 'Question',
        name: 'Combien coûte NutriCoach ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'NutriCoach coûte 6,99€ par mois sans engagement. Vous pouvez annuler à tout moment et nous offrons une garantie satisfait ou remboursé de 30 jours.'
        }
      }
    ]
  },

  // Sample recipe schema
  sampleRecipe: {
    name: 'Salade de Quinoa Anti-Inflammatoire à l\'Avocat',
    description: 'Une salade nutritive et délicieuse, riche en oméga-3 et antioxydants, parfaite pour un régime anti-inflammatoire.',
    image: 'https://nutricoach-production.up.railway.app/images/recipes/salade-quinoa-avocat.jpg',
    prepTime: 'PT15M',
    cookTime: 'PT15M',
    totalTime: 'PT30M',
    recipeYield: '4 portions',
    recipeCategory: 'Salades',
    recipeCuisine: 'Méditerranéenne',
    recipeIngredient: [
      '200g de quinoa',
      '2 avocats mûrs',
      '150g d\'épinards frais',
      '1 concombre',
      '200g de tomates cerises',
      '1/4 de tasse de graines de tournesol',
      '2 cuillères à soupe d\'huile d\'olive extra vierge',
      '1 citron (jus)',
      'Sel et poivre au goût'
    ],
    recipeInstructions: [
      {
        '@type': 'HowToStep',
        name: 'Cuisson du quinoa',
        text: 'Faire cuire le quinoa selon les instructions du paquet. Laisser refroidir.'
      },
      {
        '@type': 'HowToStep',
        name: 'Préparation des légumes',
        text: 'Couper les avocats, concombre et tomates cerises. Laver les épinards.'
      },
      {
        '@type': 'HowToStep',
        name: 'Assemblage',
        text: 'Mélanger tous les ingrédients dans un grand bol.'
      },
      {
        '@type': 'HowToStep',
        name: 'Assaisonnement',
        text: 'Ajouter l\'huile d\'olive, le jus de citron, sel et poivre. Bien mélanger.'
      }
    ],
    keywords: [
      'salade quinoa',
      'anti-inflammatoire',
      'avocat',
      'recette saine',
      'nutrition',
      'végétarien'
    ],
    nutrition: {
      '@type': 'NutritionInformation',
      calories: '320 calories',
      proteinContent: '12g',
      carbohydrateContent: '35g',
      fatContent: '18g',
      fiberContent: '8g',
      sugarContent: '6g',
      sodiumContent: '120mg'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '156'
    },
    datePublished: '2024-01-15',
    suitableForDiet: [
      'https://schema.org/VegetarianDiet',
      'https://schema.org/GlutenFreeDiet',
      'https://schema.org/AntiInflammatoryDiet'
    ]
  },

  // Breadcrumb for recipe pages
  recipeBreadcrumb: {
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: 'https://nutricoach-production.up.railway.app'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Recettes',
        item: 'https://nutricoach-production.up.railway.app/recettes'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Salades',
        item: 'https://nutricoach-production.up.railway.app/recettes/categorie/salades'
      }
    ]
  },

  // Local business schema for France
  localBusinessFrance: {
    '@type': 'HealthAndBeautyBusiness',
    name: 'NutriCoach France',
    description: 'Service de nutrition anti-inflammatoire personnalisée par IA disponible en France',
    url: 'https://nutricoach-production.up.railway.app',
    image: 'https://nutricoach-production.up.railway.app/logo.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Paris',
      addressCountry: 'FR',
      addressRegion: 'Île-de-France'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 48.8566,
      longitude: 2.3522
    },
    openingHours: 'Mo-Su 00:00-23:59',
    telephone: '+33-1-23-45-67-89',
    priceRange: '€€',
    acceptsReservations: false,
    servesCuisine: 'Healthy',
    areaServed: {
      '@type': 'Country',
      name: 'France'
    },
    paymentAccepted: ['Credit Card', 'PayPal'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1250'
    }
  },

  // Product schema for the service
  productSchema: {
    name: 'Abonnement NutriCoach Premium',
    description: 'Accès complet à la plateforme de nutrition anti-inflammatoire personnalisée par IA',
    category: 'Health & Wellness Software',
    brand: {
      '@type': 'Brand',
      name: 'NutriCoach'
    },
    offers: {
      '@type': 'Offer',
      price: '6.99',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      validFrom: '2024-01-01',
      seller: {
        '@type': 'Organization',
        name: 'NutriCoach'
      },
      priceSpecification: {
        '@type': 'RecurringPaymentFrequency',
        frequency: 'monthly'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1250'
    },
    review: [
      {
        '@type': 'Review',
        reviewBody: 'Excellente application qui m\'a vraiment aidé à améliorer mon alimentation. Les recettes sont délicieuses et les conseils personnalisés très utiles.',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5'
        },
        author: {
          '@type': 'Person',
          name: 'Marie L.'
        },
        datePublished: '2024-01-20'
      }
    ]
  }
} as const