import './globals.css'
import { Toaster } from 'sonner'
import PwaRegister from './pwa-register'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'WBS Menu - Premium Admin Panel',
    template: '%s | WBS Menu Admin',
  },
  description:
    'Manage your digital menu with ease. High-performance, secure, and intuitive admin dashboard for restaurants.',
  keywords: ['digital menu', 'restaurant admin', 'menu management', 'order tracking', 'WBS Menu'],
  authors: [{ name: 'WBS Team' }],
  creator: 'WBS Team',
  publisher: 'WBS Team',
  robots: 'index, follow',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'WBS Menu Admin',
    title: 'WBS Menu - Premium Admin Panel',
    description: 'Manage your digital menu with ease. High-performance, secure, and intuitive admin dashboard.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'WBS Menu Admin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WBS Menu - Premium Admin Panel',
    description: 'Manage your digital menu with ease. High-performance, secure, and intuitive admin dashboard.',
    images: ['/icons/icon-512.png'],
    creator: '@wbsteam',
  },
  applicationName: 'WBS Menu Admin',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F97316',
}

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WBS Menu Admin',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/icons/icon-512.png`,
    description: 'High-performance digital menu management system for restaurants.',
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <PwaRegister />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#0A0A0A',
              border: '1px solid #F97316',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  )
}
