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

const contributors = [
  {
    name: 'TheOldZoom',
    url: 'https://github.com/TheOldZoom',
  },
];

export default async function About() {
  return (
    <Wrapper className="md:grow">
      <main className="mx-auto mt-20 flex max-w-xl flex-col items-start justify-center gap-10">
        <div className="text-sm">
          <p className="font-bold uppercase text-grey">ABOUT ALBUM COLOURS</p>
          <p className="mt-4 font-medium text-grey-800">
            Album Colours is an open-source visual directory that draws colour
            palette inspiration from music album covers. We hope to help
            designers and other creatives get visual inspiration from their
            albums of choice. We are constantly adding new album covers and
            colour information. There are possibly millions of album covers
            after all.
          </p>
        </div>

        <div className="text-sm">
          <p className="font-bold uppercase text-grey">WHO ARE WE</p>

          <p className="mt-4 font-medium text-grey-800">
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

          <p className="font-medium text-grey-800">
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
          <p className="font-bold uppercase text-grey">CONTACT US</p>

          <p className="mt-4 font-medium text-grey-800">
            If you’d like to contribute to our efforts or get in touch for any
            other reason, shoot a mail to{' '}
            <a href="mailto:dayoawobeku@gmail.com" className="hover:underline">
              Dayo
            </a>{' '}
            or{' '}
            <a
              href="mailto:ajibike.oyinda@gmail.com"
              className="hover:underline"
            >
              Oyindamola
            </a>
          </p>
        </div>

        <div className="text-sm">
          <p className="font-bold uppercase text-grey">CONTRIBUTORS</p>

          <p className="mt-4 font-medium text-grey-800">
            {contributors.map((contributor, index) => (
              <span key={contributor.name}>
                <a
                  href={contributor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {contributor.name}
                </a>
                {index < contributors.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      </main>
    </Wrapper>
  );
}

export {metadata};
