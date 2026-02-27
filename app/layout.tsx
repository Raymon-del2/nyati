import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nyati - API Platform',
  description: 'Steel-protected API key management platform',
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
