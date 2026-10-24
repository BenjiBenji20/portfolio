import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BENJINEER | Benji I. Cañones',
  description:
    'Portfolio and engineering blog of Benji I. Cañones, Junior Backend Developer specializing in RAG systems, scalable architectures, and AI integrations.',
  icons: {
    icon: [
      { url: '/portfolio-logo.png?v=2', type: 'image/png' },
    ],
    shortcut: '/portfolio-logo.png?v=2',
    apple: '/portfolio-logo.png?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <head>
        <link rel="icon" href="/portfolio-logo.png?v=2" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/portfolio-logo.png?v=2" />
      </head>
      <body
        className="min-h-screen bg-zinc-950 text-zinc-100 font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
