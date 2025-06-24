import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@nutricoach/ui/styles/globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
})

export const metadata: Metadata = {
  title: "NutriCoach - Anti-Inflammatory Nutrition App",
  description: "Personalized nutrition coaching focused on reducing inflammation and improving health through evidence-based dietary recommendations.",
  keywords: ["nutrition", "anti-inflammatory", "health", "wellness", "diet", "meal planning"],
  authors: [{ name: "NutriCoach Team" }],
  openGraph: {
    title: "NutriCoach - Anti-Inflammatory Nutrition App",
    description: "Personalized nutrition coaching focused on reducing inflammation and improving health",
    type: "website",
    locale: "en_US"
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#22c55e" },
    { media: "(prefers-color-scheme: dark)", color: "#16a34a" }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}