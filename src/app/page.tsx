import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {Suspense} from 'react';
import {arrowRight} from '@/assets/images';
import Draggable from '@/components/draggable';
import Grid from '@/components/grid';
import AlbumCardGrid from '@/components/album-card';
import {supabase} from '@/utils/supabase';
import {Album} from '@/types';
import Wrapper from '@/components/wrapper';

const metadata: Metadata = {
  title: 'Album Colors | Color palettes from your favorite music album covers',
  description:
    "Discover vibrant color palettes inspired by your favorite artist's album covers",
  openGraph: {
    title:
      'Album Colors | Color palettes from your favorite music album covers',
    description:
      "Discover vibrant color palettes inspired by your favorite artist's album covers",
    images:
      'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    url: 'https://albumcolours.co',
  },
  twitter: {
    title:
      'Album Colors | Color palettes from your favorite music album covers',
    description:
      "Discover vibrant color palettes inspired by your favorite artist's album covers",
    images: {
      url: 'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    },
  },
};

async function AlbumGrid() {
  const {data} = await supabase.from('artistes').select('*');

  return (
    <>
      <AlbumCardGrid data={data as Album[]} />
      <div className="hidden lg:flex items-center justify-center gap-1 whitespace-nowrap group m-auto">
        <Link href="/archive" className="text-grey text-sm font-bold uppercase">
          See all albums
        </Link>
        <Image
          src={arrowRight}
          alt="arrow right"
          width={46}
          height={18}
          className="transition-all duration-300 group-hover:translate-x-1"
        />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Wrapper className="grow">
      <main>
        <Draggable rootClass={'drag'}>
          <Grid>
            <Suspense
              fallback={<div className="animate-pulse bg-grey-100 h-64" />}
            >
              <AlbumGrid />
            </Suspense>
          </Grid>
        </Draggable>
        <div className="my-6 lg:hidden flex items-center justify-center gap-1 whitespace-nowrap group m-auto">
          <Link
            href="/archive"
            className="text-grey text-sm font-bold uppercase"
          >
            See all albums
          </Link>
          <Image
            src={arrowRight}
            alt="arrow right"
            width={46}
            height={18}
            className="transition-all duration-300 group-hover:translate-x-1"
          />
        </div>
      </main>
    </Wrapper>
  );
}

export {metadata};
