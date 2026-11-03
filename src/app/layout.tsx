import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Coolio Email — Custom @ddylongneck.com Aliases',
  description: 'Create custom email aliases like coolio@ddylongneck.com and send/receive from them instantly.',
  authors: [{ name: 'Brody Lind' }],
  openGraph: {
    title: 'Coolio Email — Custom @ddylongneck.com Aliases',
    description: 'Create custom email aliases and send/receive from them instantly.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen`}>
        {children}
      </body>
    </html>
  );
}