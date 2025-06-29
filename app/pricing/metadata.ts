import { generateSEOMetadata, seoConfigs } from '@/components/seo/SEOHead'

export const metadata = generateSEOMetadata({
  ...seoConfigs.pricing,
  url: '/pricing',
  canonical: 'https://nutricoach-production.up.railway.app/pricing',
})