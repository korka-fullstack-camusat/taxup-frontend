import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'TAXUP - Surveillance Fiscale',
  description: 'Plateforme de surveillance des transactions mobiles et conformité fiscale',
  icons: {
    icon: '/taxup-logo.svg',
    shortcut: '/taxup-logo.svg',
    apple: '/taxup-logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
