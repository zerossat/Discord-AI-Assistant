import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Discord AI Assistant — Dashboard',
  description: 'Admin dashboard for the Discord AI Assistant bot.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
