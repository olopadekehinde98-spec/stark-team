import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stark Team',
  description: 'Private internal operations platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <div className="scan-line" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
