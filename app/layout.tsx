import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Panonka Viewer - 3D Interactive',
  description: 'Interaktivni 3D prikaz Panonke',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

