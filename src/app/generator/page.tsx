import type {Metadata} from 'next';
import {Suspense} from 'react';
import {supabase} from '@/utils/supabase';
import {Album} from '@/types';
import Palettes from '@/components/palettes';

const metadata: Metadata = {
  title: 'Album Colors Generator | Color Palettes from Music Albums',
  description:
    'Explore a vibrant collection of color palettes extracted from your favorite music albums',
  openGraph: {
    title: 'Album Colors Generator | Color Palettes from Music Albums',
    description:
      'Explore a vibrant collection of color palettes extracted from your favorite music albums',
    images:
      'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    url: 'https://albumcolours.co/generator',
  },
  twitter: {
    title: 'Album Colors Generator | Color Palettes from Music Albums',
    description:
      'Explore a vibrant collection of color palettes extracted from your favorite music albums',
    images: {
      url: 'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    },
  },
};

async function GeneratorContent() {
  const {data} = await supabase
    .from('artistes')
    .select('*')
    .order('created_at', {ascending: false});

  const allAlbums =
    data?.reduce((acc: Album[], artist) => {
      return [...acc, ...artist.albums];
    }, []) || [];

  return <Palettes allAlbums={allAlbums} data={data || []} />;
}

export default function Generator() {
  return (
    <main className="grow mt-16 sm:mt-24">
      <Suspense fallback={<div className="animate-pulse bg-grey-100 h-64" />}>
        <GeneratorContent />
      </Suspense>
    </main>
  );
}

export {metadata};
