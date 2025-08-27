import React from 'react'
import '@/app/globals.css'
import { ToastProvider } from '@/contexts/ToastContext'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
  description:
    'Circle Kitchen - Home-cooked meals delivered to your doorstep in Oman. Order delicious biriyani, curries, and more with 24-hour advance booking.',
  title: 'Circle Kitchen - Home Food Delivery in Oman',
}

// Disable all caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
