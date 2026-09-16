import type {Metadata} from 'next';
import {Suspense} from 'react';
import SearchClient from '@/components/search';
import {supabase} from '@/utils/supabase';
import Wrapper from '@/components/wrapper';

const metadata: Metadata = {
  title: 'Search Albums and Artists | Find Color Inspiration in Music',
  description:
    'Search and discover a diverse range of albums and artists to inspire your creativity with captivating color palettes',
  openGraph: {
    title: 'Search Albums and Artists | Find Color Inspiration in Music',
    description:
      'Search and discover a diverse range of albums and artists to inspire your creativity with captivating color palettes',
    images:
      'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    url: 'https://albumcolours.co/search',
  },
  twitter: {
    title: 'Search Albums and Artists | Find Color Inspiration in Music',
    description:
      'Search and discover a diverse range of albums and artists to inspire your creativity with captivating color palettes',
    images: {
      url: 'https://res.cloudinary.com/dedywga3v/image/upload/v1698911657/meta_image_guzgce.png',
    },
  },
};

async function SearchResults() {
  const {data} = await supabase.from('artistes').select('*');
  return <SearchClient data={data || []} />;
}

export default function Search() {
  return (
    <Wrapper className="grow">
      <main className="mt-16 sm:mt-24">
        <Suspense fallback={<div className="animate-pulse bg-grey-100 h-64" />}>
          <SearchResults />
        </Suspense>
      </main>
    </Wrapper>
  );
}

export {metadata};
