import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nyati - API Platform',
  description: 'Steel-protected API key management platform',
  icons: {
    icon: '/logo.webp',
    shortcut: '/logo.webp',
    apple: '/logo.webp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
