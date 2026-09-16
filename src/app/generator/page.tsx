import type {Metadata} from 'next';
import {supabase} from '@/utils/supabase';
import {Album} from '@/types';
import Palettes from '@/components/palettes';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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

export const revalidate = 0;

export default async function Generator() {
  const {data, error} = await supabase
    .from('artistes')
    .select('*')
    .order('created_at', {ascending: false});

  const allAlbums = data?.reduce((acc: Album[], artist) => {
    return [...acc, ...artist.albums];
  }, []);

  return (
    <main className="grow mt-16 sm:mt-24">
      <Palettes allAlbums={allAlbums} data={data || []} />
    </main>
  );
}

export {metadata};
