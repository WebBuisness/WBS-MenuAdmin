import './globals.css'
import { Toaster } from 'sonner'
import PwaRegister from './pwa-register'

export const metadata = {
  title: {
    default: 'WBS Menu - Premium Admin Panel',
    template: '%s | WBS Menu Admin',
  },
  description:
    'Manage your digital menu with ease. High-performance, secure, and intuitive admin dashboard for restaurants.',
  robots: 'noindex, nofollow',
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
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
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
