import type {Metadata} from 'next';
import {Suspense} from 'react';
import {Analytics} from '@vercel/analytics/react';
import {tomatoGrotesk} from '../../public/fonts';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import './globals.css';

const metadata: Metadata = {
  openGraph: {
    images:
      'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_APP_GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_APP_GA_MEASUREMENT_ID}');`,
          }}
        />
      </head>
      <body
        className={`${tomatoGrotesk.className} min-h-screen bg-white px-4 lg:px-[25px] pt-2 pb-6 flex flex-col`}
      >
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

export {metadata};
