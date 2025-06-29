import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DynamicSEO from '@/components/seo/DynamicSEO'
import { StructuredData, schemaData } from '@/components/seo/StructuredData'
import { OptimizedImage, imagePresets } from '@/components/ui/OptimizedImage'

interface BlogPost {
  slug: string
  title: string
  description: string
  content: string
  author: string
  publishedAt: string
  updatedAt: string
  image: string
  tags: string[]
  category: string
  readTime: number
  relatedPosts?: string[]
}

// Mock blog data - in production, this would come from a CMS or database
const blogPosts: Record<string, BlogPost> = {
  'nutrition-anti-inflammatoire-guide-complet': {
    slug: 'nutrition-anti-inflammatoire-guide-complet',
    title: 'Guide Complet de la Nutrition Anti-Inflammatoire : Transformez Votre Santé',
    description: 'Découvrez comment la nutrition anti-inflammatoire peut révolutionner votre bien-être. Guide complet avec aliments, recettes et conseils d\'experts.',
    content: `
# Guide Complet de la Nutrition Anti-Inflammatoire

L'inflammation chronique est à l'origine de nombreuses maladies modernes : arthrite, diabète type 2, maladies cardiovasculaires, et même certains cancers. Heureusement, notre alimentation peut être notre meilleur allié pour combattre cette inflammation silencieuse.

## Qu'est-ce que l'inflammation chronique ?

L'inflammation est une réponse naturelle de notre système immunitaire face à une agression. Cependant, quand elle devient chronique, elle peut endommager nos tissus et organes. C'est là qu'intervient la nutrition anti-inflammatoire.

## Les aliments anti-inflammatoires stars

### 1. Les poissons gras
- **Saumon, maquereau, sardines** : riches en oméga-3
- Recommandation : 2-3 portions par semaine
- Préparation idéale : grillé, cuit à la vapeur ou en papillote

### 2. Les légumes verts à feuilles
- **Épinards, kale, roquette** : antioxydants puissants
- Riches en vitamines A, C, E et K
- À consommer quotidiennement, de préférence crus ou légèrement cuits

### 3. Les baies
- **Myrtilles, framboises, mûres** : anthocyanes anti-inflammatoires
- Parfaites en smoothie ou nature
- Privilégier les baies biologiques surgelées hors saison

## Aliments à éviter

### Les pro-inflammatoires
- Sucre raffiné et édulcorants artificiels
- Huiles végétales industrielles (tournesol, maïs)
- Viandes transformées (charcuterie, saucisses)
- Aliments ultra-transformés

## Plan de repas anti-inflammatoire type

### Petit-déjeuner
- Porridge d'avoine aux myrtilles et noix
- Thé vert ou tisane de curcuma

### Déjeuner
- Salade de quinoa aux légumes colorés
- Saumon grillé à l'aneth
- Avocat et graines de tournesol

### Dîner
- Soupe de lentilles au curcuma
- Légumes rôtis à l'huile d'olive
- Compote de pommes à la cannelle

## Les bienfaits scientifiquement prouvés

Des études récentes montrent qu'un régime anti-inflammatoire peut :
- Réduire les marqueurs inflammatoires de 30% en 6 semaines
- Améliorer la qualité du sommeil
- Augmenter l'énergie et la vitalité
- Renforcer le système immunitaire

## Comment NutriCoach vous accompagne

Notre intelligence artificielle analyse vos préférences, restrictions et objectifs pour créer des menus anti-inflammatoires personnalisés. Chaque recette est optimisée pour maximiser les nutriments anti-inflammatoires tout en respectant vos goûts.

**Prêt à commencer ?** Découvrez comment NutriCoach peut transformer votre alimentation dès aujourd'hui.
    `,
    author: 'Dr. Sarah Martin, Nutritionniste',
    publishedAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    image: '/images/blog/nutrition-anti-inflammatoire-guide.jpg',
    tags: ['nutrition', 'anti-inflammatoire', 'santé', 'alimentation', 'bien-être'],
    category: 'Nutrition',
    readTime: 8,
    relatedPosts: ['recettes-anti-inflammatoires-faciles', 'aliments-anti-inflammatoires-liste']
  },
  'recettes-anti-inflammatoires-faciles': {
    slug: 'recettes-anti-inflammatoires-faciles',
    title: '10 Recettes Anti-Inflammatoires Faciles pour Débutants',
    description: 'Recettes simples et délicieuses pour débuter la nutrition anti-inflammatoire. Prêtes en moins de 30 minutes, validées par nos nutritionnistes.',
    content: `
# 10 Recettes Anti-Inflammatoires Faciles pour Débutants

Vous voulez adopter une alimentation anti-inflammatoire mais ne savez pas par où commencer ? Ces 10 recettes simples et savoureuses sont parfaites pour débuter en douceur.

## 1. Smoothie Vert Énergisant

**Ingrédients :**
- 1 tasse d'épinards frais
- 1 banane
- 1/2 avocat
- 1 tasse de lait d'amande
- 1 cuillère à café de gingembre frais
- 1 cuillère à soupe de graines de chia

**Préparation :** Mixez tous les ingrédients jusqu'à obtenir une texture lisse. Parfait pour le petit-déjeuner !

## 2. Salade de Quinoa Arc-en-Ciel

Une explosion de couleurs et de saveurs anti-inflammatoires.

**Ingrédients :**
- 1 tasse de quinoa cuit
- 1/2 concombre en dés
- 1 poivron rouge
- 1/4 de chou rouge râpé
- 1 avocat
- Graines de grenade
- Vinaigrette à l'huile d'olive et citron

## 3. Saumon au Curcuma et Légumes

Riche en oméga-3 et en antioxydants.

**Temps de préparation :** 25 minutes
**Portions :** 2

Cette recette combine les bienfaits du saumon sauvage avec les propriétés anti-inflammatoires du curcuma.

## Conseils pour réussir

### Organisation
- Préparez vos ingrédients à l'avance
- Investissez dans un bon blender
- Conservez des épices anti-inflammatoires : curcuma, gingembre, cannelle

### Shopping list
- Légumes verts à feuilles
- Poissons gras
- Noix et graines
- Huile d'olive extra vierge
- Épices fraîches

## L'avantage NutriCoach

Avec NutriCoach, ces recettes s'adaptent automatiquement à vos préférences et restrictions. Notre IA calcule les portions parfaites et génère votre liste de courses optimisée.

**Envie de plus de recettes personnalisées ?** Découvrez notre générateur de menus intelligent.
    `,
    author: 'Chef Marie Dubois',
    publishedAt: '2024-01-10T14:00:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
    image: '/images/blog/recettes-anti-inflammatoires.jpg',
    tags: ['recettes', 'anti-inflammatoire', 'cuisine', 'facile', 'débutant'],
    category: 'Recettes',
    readTime: 6,
    relatedPosts: ['nutrition-anti-inflammatoire-guide-complet', 'aliments-anti-inflammatoires-liste']
  },
  'aliments-anti-inflammatoires-liste': {
    slug: 'aliments-anti-inflammatoires-liste',
    title: 'Les 50 Meilleurs Aliments Anti-Inflammatoires à Intégrer Dès Maintenant',
    description: 'Liste complète des aliments les plus puissants contre l\'inflammation. Propriétés, bienfaits et conseils d\'utilisation par nos experts.',
    content: `
# Les 50 Meilleurs Aliments Anti-Inflammatoires

Voici la liste complète des aliments les plus efficaces pour combattre l'inflammation chronique, classés par catégorie.

## Poissons et Fruits de Mer (Oméga-3)

1. **Saumon sauvage** - Roi des oméga-3
2. **Maquereau** - Alternative économique
3. **Sardines** - Pratiques en conserve
4. **Anchois** - Parfaits en salade
5. **Truite** - Délicate et nutritive

## Légumes Anti-Inflammatoires

### Légumes verts
6. **Épinards** - Fer et antioxydants
7. **Kale** - Superfood polyvalent
8. **Brocolis** - Sulforaphane protecteur
9. **Roquette** - Piquant et vitaminé
10. **Blettes** - Riches en magnésium

### Légumes colorés
11. **Betteraves** - Nitrates bénéfiques
12. **Carottes** - Bêta-carotène
13. **Poivrons rouges** - Vitamine C
14. **Tomates** - Lycopène antioxydant
15. **Aubergines** - Anthocyanes

## Fruits Anti-Inflammatoires

### Baies (les plus puissantes)
16. **Myrtilles** - Champions antioxydants
17. **Framboises** - Fibres et vitamine C
18. **Mûres** - Anthocyanes concentrées
19. **Cranberries** - Protection urinaire
20. **Açaï** - Superfruit exotique

### Autres fruits
21. **Cerises** - Anti-inflammatoires naturels
22. **Oranges** - Vitamine C et flavonoïdes
23. **Ananas** - Bromélaïne enzymatique
24. **Papaye** - Papaïne digestive
25. **Avocat** - Graisses saines

## Noix et Graines

26. **Noix** - Oméga-3 végétaux
27. **Amandes** - Vitamine E
28. **Graines de lin** - Lignanes protectrices
29. **Graines de chia** - Fibres et protéines
30. **Graines de tournesol** - Sélénium

## Épices et Herbes

31. **Curcuma** - Curcumine puissante
32. **Gingembre** - Gingerol actif
33. **Cannelle** - Régulation glycémique
34. **Ail** - Allicine antibactérienne
35. **Origan** - Antioxydants concentrés

## Légumineuses

36. **Lentilles** - Protéines et fibres
37. **Haricots rouges** - Anthocyanes
38. **Pois chiches** - Polyvalents
39. **Haricots noirs** - Antioxydants
40. **Fèves** - L-dopa naturelle

## Céréales et Graines Complètes

41. **Quinoa** - Protéine complète
42. **Avoine** - Bêta-glucanes
43. **Riz brun** - Fibres et magnésium
44. **Sarrasin** - Sans gluten
45. **Millet** - Minéraux essentiels

## Huiles et Graisses Saines

46. **Huile d'olive extra vierge** - Polyphénols
47. **Huile de coco** - Acides gras moyens
48. **Huile d'avocat** - Stable à haute température

## Boissons Anti-Inflammatoires

49. **Thé vert** - EGCG antioxydant
50. **Thé blanc** - Le plus délicat

## Comment les intégrer ?

### Règle des 5 couleurs
Chaque repas devrait contenir au moins 3 couleurs différentes de légumes/fruits.

### Rotation hebdomadaire
Variez vos sources pour maximiser la diversité nutritionnelle.

### Préparation optimale
- Cuisson douce pour préserver les nutriments
- Association intelligente (curcuma + poivre noir)
- Consommation rapide après préparation

## Score anti-inflammatoire NutriCoach

Notre IA calcule automatiquement le score anti-inflammatoire de vos repas et vous suggère des améliorations personnalisées.

**Découvrez votre score** avec notre générateur de menus intelligent.
    `,
    author: 'Équipe NutriCoach',
    publishedAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-05T11:00:00Z',
    image: '/images/blog/aliments-anti-inflammatoires.jpg',
    tags: ['aliments', 'anti-inflammatoire', 'liste', 'nutrition', 'guide'],
    category: 'Nutrition',
    readTime: 10,
    relatedPosts: ['nutrition-anti-inflammatoire-guide-complet', 'recettes-anti-inflammatoires-faciles']
  },
  'ia-nutrition-personnalisee-avenir': {
    slug: 'ia-nutrition-personnalisee-avenir',
    title: 'L\'IA au Service de la Nutrition Personnalisée : L\'Avenir de l\'Alimentation Santé',
    description: 'Comment l\'intelligence artificielle révolutionne la nutrition personnalisée. Découvrez les technologies qui transforment notre approche de l\'alimentation.',
    content: `
# L'IA au Service de la Nutrition Personnalisée

L'intelligence artificielle transforme radicalement notre approche de la nutrition. Fini le régime unique pour tous : place à l'alimentation sur-mesure, adaptée à votre ADN, votre mode de vie et vos objectifs.

## La révolution en cours

### Analyse prédictive
L'IA peut prédire comment votre corps réagira à certains aliments en analysant :
- Votre microbiome intestinal
- Vos marqueurs génétiques
- Vos habitudes alimentaires passées
- Vos réponses physiologiques

### Personnalisation extrême
Chaque recommandation devient unique, tenant compte de :
- Vos allergies et intolérances
- Votre emploi du temps
- Vos préférences gustatives
- Votre budget alimentaire

## Comment NutriCoach utilise l'IA

### Apprentissage continu
Notre algorithme apprend de vos retours pour affiner ses recommandations. Plus vous l'utilisez, plus il devient précis.

### Optimisation nutritionnelle
Calcul automatique des portions parfaites pour atteindre vos objectifs sans carence ni excès.

### Adaptation temps réel
Modifications instantanées selon votre activité, stress, sommeil ou changements de santé.

## L'avenir proche

### Intégration IoT
Connexion avec vos objets connectés (balance, tracker d'activité, glucomètre) pour un suivi en temps réel.

### Analyse alimentaire instantanée
Reconnaissance des aliments par photo pour un tracking nutritionnel automatique.

### Recommandations contextuelles
Suggestions adaptées à votre localisation, météo, et contexte social.

## Les bénéfices prouvés

Studies montrent que la nutrition personnalisée par IA permet :
- 3x plus de chances d'atteindre ses objectifs
- Réduction de 40% des carences nutritionnelles  
- Amélioration de 50% de l'adhésion au régime

**L'avenir de la nutrition est déjà là.** Découvrez la puissance de l'IA nutritionnelle avec NutriCoach.
    `,
    author: 'Dr. Thomas Leroy, PhD en IA',
    publishedAt: '2023-12-20T16:00:00Z',
    updatedAt: '2023-12-22T10:30:00Z',
    image: '/images/blog/ia-nutrition-avenir.jpg',
    tags: ['intelligence artificielle', 'nutrition', 'personnalisation', 'technologie', 'innovation'],
    category: 'Technologie',
    readTime: 7,
    relatedPosts: ['nutrition-anti-inflammatoire-guide-complet']
  }
}

interface BlogPageProps {
  params: {
    slug: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const post = blogPosts[params.slug]
  
  if (!post) {
    return {
      title: 'Article non trouvé - Blog NutriCoach',
      description: 'L\'article demandé n\'existe pas.',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nutricoach-production.up.railway.app'
  
  return {
    title: `${post.title} | Blog NutriCoach`,
    description: post.description,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      section: post.category,
      tags: post.tags,
      images: [
        {
          url: `${baseUrl}${post.image}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [`${baseUrl}${post.image}`],
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  }
}

// Generate static params for build optimization
export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }))
}

export default function BlogPost({ params }: BlogPageProps) {
  const post = blogPosts[params.slug]

  if (!post) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nutricoach-production.up.railway.app'
  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.category, url: `/blog/category/${post.category.toLowerCase()}` },
    { name: post.title, url: `/blog/${post.slug}` }
  ]

  return (
    <>
      {/* SEO Components */}
      <DynamicSEO
        title={`${post.title} | Blog NutriCoach`}
        description={post.description}
        keywords={post.tags}
        image={post.image}
        type="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt}
        author={post.author}
        section={post.category}
        breadcrumbs={breadcrumbs}
      />

      {/* Article Schema */}
      <StructuredData 
        type="Article" 
        data={{
          headline: post.title,
          description: post.description,
          image: `${baseUrl}${post.image}`,
          author: {
            '@type': 'Person',
            name: post.author
          },
          publisher: {
            '@type': 'Organization',
            name: 'NutriCoach',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`
            }
          },
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${baseUrl}/blog/${post.slug}`
          },
          keywords: post.tags.join(', '),
          articleSection: post.category,
          wordCount: post.content.split(' ').length,
          timeRequired: `PT${post.readTime}M`
        }} 
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative h-96 overflow-hidden">
          <OptimizedImage
            src={post.image}
            alt={post.title}
            fill
            {...imagePresets.hero}
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white max-w-4xl mx-auto px-4">
              <div className="mb-4">
                <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {post.category}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>
              <p className="text-xl mb-6 opacity-90">
                {post.description}
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <span>Par {post.author}</span>
                <span>•</span>
                <span>{new Date(post.publishedAt).toLocaleDateString('fr-FR')}</span>
                <span>•</span>
                <span>{post.readTime} min de lecture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="bg-white border-b" aria-label="Fil d'Ariane">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <ol className="flex space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.url} className="flex items-center">
                  {index > 0 && <span className="text-gray-400 mx-2">/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-600 font-medium truncate max-w-xs">
                      {crumb.name}
                    </span>
                  ) : (
                    <a
                      href={crumb.url}
                      className="text-green-600 hover:text-green-700 hover:underline"
                    >
                      {crumb.name}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Article Meta */}
            <header className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <span>Dernière mise à jour : {new Date(post.updatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </header>

            {/* Article Body */}
            <div className="prose prose-lg max-w-none">
              {/* Convert markdown-like content to HTML in a real implementation */}
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>').replace(/##/g, '<h2>').replace(/<h2>/g, '</p><h2>').replace(/<\/h2>/g, '</h2><p>') }} />
            </div>

            {/* Call to Action */}
            <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Prêt à mettre en pratique ces conseils ?
              </h3>
              <p className="text-gray-600 mb-4">
                Découvrez comment NutriCoach peut créer un plan nutritionnel personnalisé basé sur ces principes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/menu/generate"
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  Générer mon menu
                </a>
                <a
                  href="/pricing"
                  className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold text-center hover:bg-green-600 hover:text-white transition-all"
                >
                  Voir les tarifs
                </a>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Articles similaires</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {post.relatedPosts.map(relatedSlug => {
                const relatedPost = blogPosts[relatedSlug]
                if (!relatedPost) return null
                
                return (
                  <a
                    key={relatedSlug}
                    href={`/blog/${relatedSlug}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <OptimizedImage
                      src={relatedPost.image}
                      alt={relatedPost.title}
                      width={400}
                      height={250}
                      {...imagePresets.blogThumbnail}
                      className="w-full h-48"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {relatedPost.description}
                      </p>
                      <div className="mt-3 text-xs text-gray-500">
                        {relatedPost.readTime} min de lecture
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}