import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Building Viewer - 3D Interactive',
  description: 'Interactive 3D building viewer with apartment selection',
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

