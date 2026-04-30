import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: {
    default: 'WBS Menu — Premium Admin Panel',
    template: '%s | WBS Menu Admin'
  },
  description: 'Manage your digital menu with ease. High-performance, secure, and intuitive admin dashboard for restaurants.',
  robots: 'noindex, nofollow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
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
