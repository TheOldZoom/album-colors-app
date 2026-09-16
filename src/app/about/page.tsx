import type {Metadata} from 'next';
import Wrapper from '@/components/wrapper';

const metadata: Metadata = {
  title: 'About Album Colors | Our Story and Mission',
  description:
    'Learn more about Album Colors and why we are turning album covers into beautiful color palettes',
  openGraph: {
    title: 'About Album Colors | Our Story and Mission',
    description:
      'Learn more about Album Colors and why we are turning album covers into beautiful color palettes',
    images:
      'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    url: 'https://albumcolours.co/about',
  },
  twitter: {
    title: 'About Album Colors | Our Story and Mission',
    description:
      'Learn more about Album Colors and why we are turning album covers into beautiful color palettes',
    images: {
      url: 'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    },
  },
};

export default async function About() {
  return (
    <Wrapper className="md:grow">
      <main className="mt-20 flex flex-col items-start justify-center gap-10 max-w-xl mx-auto">
        <div className="text-sm">
          <p className="uppercase text-grey font-bold">ABOUT ALBUM COLOURS</p>
          <p className="mt-4 text-grey-800 font-medium">
            Album Colours is an open-source visual directory that draws colour
            palette inspiration from music album covers. We hope to help
            designers and other creatives get visual inspiration from their
            albums of choice. We are constantly updating new album covers and
            colour information. There are possibly millions of album covers
            after all.
          </p>
        </div>
        <div className="text-sm">
          <p className="uppercase text-grey font-bold">WHO ARE WE</p>
          <p className="mt-4 text-grey-800 font-medium">
            <a
              href="https://read.cv/dammy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Oyindamola Ajibike
            </a>{' '}
            - pixels bending product designer
          </p>
          <p className="text-grey-800 font-medium">
            <a
              href="https://dayoawobeku.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Dayo Awobeku
            </a>{' '}
            - frontend developer crafting pixel-perfect, high-quality
            applications
          </p>
        </div>
        <div className="text-sm">
          <p className="uppercase text-grey font-bold">CONTACT US</p>
          <p className="mt-4 text-grey-800 font-medium">
            If you’d like to contribute to our efforts or get in touch for any
            other reason, shoot a mail to{' '}
            <a
              href="mailto:dayoawobeku@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Dayo
            </a> {' '} or {' '}
            <a
              href="mailto:ajibike.oyinda@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Oyindamola
            </a>
          </p>
        </div>
      </main>
    </Wrapper>
  );
}

export {metadata};
