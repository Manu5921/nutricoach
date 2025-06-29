import { NextRequest, NextResponse } from 'next/server'

interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
  alternates?: {
    languages: Record<string, string>
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nutricoach-production.up.railway.app'
  
  // Get current date for last modified
  const now = new Date()
  
  // Core static pages with intelligent priority scoring
  const staticPages: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0, // Homepage - highest priority
      alternates: {
        languages: {
          'fr-FR': baseUrl,
          'fr': baseUrl
        }
      }
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9, // Pricing page - high conversion potential
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/pricing`,
          'fr': `${baseUrl}/pricing`
        }
      }
    },
    {
      url: `${baseUrl}/menu/generate`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8, // Core feature page - high user value
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/menu/generate`,
          'fr': `${baseUrl}/menu/generate`
        }
      }
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8, // Conversion page
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/signup`,
          'fr': `${baseUrl}/signup`
        }
      }
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4, // Utility page - lower priority
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/login`,
          'fr': `${baseUrl}/login`
        }
      }
    }
  ]

  // Legal and compliance pages - required but lower priority
  const legalPages: SitemapEntry[] = [
    {
      url: `${baseUrl}/legal`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/legal`,
          'fr': `${baseUrl}/legal`
        }
      }
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/privacy`,
          'fr': `${baseUrl}/privacy`
        }
      }
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/terms`,
          'fr': `${baseUrl}/terms`
        }
      }
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/cookies`,
          'fr': `${baseUrl}/cookies`
        }
      }
    }
  ]

  // Blog/content pages (when blog system is implemented)
  const blogPages: SitemapEntry[] = await getBlogPages(baseUrl)

  // Recipe pages (dynamic - high SEO value for nutrition keywords)
  const recipePages: SitemapEntry[] = await getRecipePages(baseUrl)

  // Combine all pages
  const allPages = [
    ...staticPages,
    ...legalPages,
    ...blogPages,
    ...recipePages
  ].sort((a, b) => b.priority - a.priority) // Sort by priority

  // Generate XML sitemap
  const sitemap = generateSitemapXML(allPages)

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours cache
    },
  })
}

// Get blog pages (placeholder for future blog implementation)
async function getBlogPages(baseUrl: string): Promise<SitemapEntry[]> {
  // This would fetch from your CMS or database in a real implementation
  const blogPosts = [
    {
      slug: 'nutrition-anti-inflammatoire-guide-complet',
      title: 'Guide Complet de la Nutrition Anti-Inflammatoire',
      publishedAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      priority: 0.7
    },
    {
      slug: 'recettes-anti-inflammatoires-faciles',
      title: '10 Recettes Anti-Inflammatoires Faciles pour Débutants',
      publishedAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12'),
      priority: 0.6
    },
    {
      slug: 'aliments-anti-inflammatoires-liste',
      title: 'Les 50 Meilleurs Aliments Anti-Inflammatoires',
      publishedAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05'),
      priority: 0.6
    },
    {
      slug: 'ia-nutrition-personnalisee-avenir',
      title: 'L\'IA au Service de la Nutrition Personnalisée',
      publishedAt: new Date('2023-12-20'),
      updatedAt: new Date('2023-12-22'),
      priority: 0.5
    }
  ]

  return blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: post.priority,
    alternates: {
      languages: {
        'fr-FR': `${baseUrl}/blog/${post.slug}`,
        'fr': `${baseUrl}/blog/${post.slug}`
      }
    }
  }))
}

// Get recipe pages (high SEO value for long-tail keywords)
async function getRecipePages(baseUrl: string): Promise<SitemapEntry[]> {
  // This would fetch from your database in a real implementation
  const recipes = [
    {
      slug: 'salade-quinoa-avocat-anti-inflammatoire',
      category: 'salades',
      publishedAt: new Date('2024-01-01'),
      priority: 0.6
    },
    {
      slug: 'saumon-grille-curcuma-legumes',
      category: 'plats-principaux',
      publishedAt: new Date('2024-01-02'),
      priority: 0.6
    },
    {
      slug: 'smoothie-vert-epinards-gingembre',
      category: 'boissons',
      publishedAt: new Date('2024-01-03'),
      priority: 0.5
    },
    {
      slug: 'soupe-lentilles-curcuma-anti-inflammatoire',
      category: 'soupes',
      publishedAt: new Date('2024-01-04'),
      priority: 0.5
    },
    {
      slug: 'bol-buddha-quinoa-legumes-racine',
      category: 'bols',
      publishedAt: new Date('2024-01-05'),
      priority: 0.5
    }
  ]

  const recipePages: SitemapEntry[] = []

  // Add individual recipe pages
  recipes.forEach(recipe => {
    recipePages.push({
      url: `${baseUrl}/recettes/${recipe.slug}`,
      lastModified: recipe.publishedAt,
      changeFrequency: 'monthly',
      priority: recipe.priority,
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/recettes/${recipe.slug}`,
          'fr': `${baseUrl}/recettes/${recipe.slug}`
        }
      }
    })
  })

  // Add recipe category pages
  const categories = [...new Set(recipes.map(r => r.category))]
  categories.forEach(category => {
    recipePages.push({
      url: `${baseUrl}/recettes/categorie/${category}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
      alternates: {
        languages: {
          'fr-FR': `${baseUrl}/recettes/categorie/${category}`,
          'fr': `${baseUrl}/recettes/categorie/${category}`
        }
      }
    })
  })

  // Main recipes index page
  recipePages.push({
    url: `${baseUrl}/recettes`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
    alternates: {
      languages: {
        'fr-FR': `${baseUrl}/recettes`,
        'fr': `${baseUrl}/recettes`
      }
    }
  })

  return recipePages
}

function generateSitemapXML(pages: SitemapEntry[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const sitemapStart = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
  const sitemapEnd = '</urlset>'

  const urls = pages.map(page => {
    let url = `
    <url>
      <loc>${escapeXml(page.url)}</loc>
      <lastmod>${page.lastModified.toISOString()}</lastmod>
      <changefreq>${page.changeFrequency}</changefreq>
      <priority>${page.priority.toFixed(1)}</priority>`

    // Add hreflang alternates if available
    if (page.alternates?.languages) {
      Object.entries(page.alternates.languages).forEach(([lang, href]) => {
        url += `
      <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}" />`
      })
    }

    url += `
    </url>`
    return url
  }).join('')

  return `${xmlHeader}
${sitemapStart}${urls}
${sitemapEnd}`
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

// Additional sitemap index for large sites (future-proofing)
export async function generateSitemapIndex(baseUrl: string): Promise<string> {
  const sitemaps = [
    {
      url: `${baseUrl}/sitemap.xml`,
      lastmod: new Date().toISOString()
    },
    {
      url: `${baseUrl}/sitemap-recipes.xml`,
      lastmod: new Date().toISOString()
    },
    {
      url: `${baseUrl}/sitemap-blog.xml`,
      lastmod: new Date().toISOString()
    }
  ]

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const sitemapIndexStart = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  const sitemapIndexEnd = '</sitemapindex>'

  const sitemapEntries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>${escapeXml(sitemap.url)}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('')

  return `${xmlHeader}
${sitemapIndexStart}${sitemapEntries}
${sitemapIndexEnd}`
}