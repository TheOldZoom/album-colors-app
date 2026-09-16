import type {Metadata, ResolvingMetadata} from 'next';
import Image from 'next/image';
import {Suspense} from 'react';
import NextPrevAlbum from '@/components/next-prev-album';
import {Album} from '@/types';
import {supabase} from '@/utils/supabase';
import AlbumTable from '@/components/album-table';
import {external} from '@/assets/images';

export async function generateMetadata(
  props: {params: Promise<{id: string}>},
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;

  const {data} = await supabase.from('artistes').select('*');

  const artiste = data?.find(
    artist => artist?.albums?.some((album: Album) => album?.album_id === id),
  );

  const album: Album = artiste.albums.find(
    (album: Album) => album?.album_id === id,
  );

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${artiste.name} - ${album.album_title}`,
    description: `${artiste.name} - ${album.album_title}`,
    openGraph: {
      images: [album.cover_image, ...previousImages],
      title: `${artiste.name} - ${album.album_title}`,
      description: `${artiste.name} - ${album.album_title}`,
      url: `https://albumcolors.co/album/${id}`,
    },
    twitter: {
      title: `${artiste.name} - ${album.album_title}`,
      description: `${artiste.name} - ${album.album_title}`,
      images: {
        url: album.cover_image,
      },
    },
  };
}

async function AlbumContent(props: {params: Promise<{id: string}>}) {
  const params = await props.params;
  const id = params.id;

  const {data} = await supabase.from('artistes').select('*');

  const artiste = data?.find(
    artist => artist?.albums?.some((album: Album) => album?.album_id === id),
  );

  const album: Album = artiste.albums.find(
    (album: Album) => album?.album_id === id,
  );

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.substring(0, n - 1) + '...' : str;
  };

  return (
    <main className="grow mt-16 sm:mt-24 flex flex-col lg:flex-row items-stretch lg:items-center justify-between basis-full xl:px-6 gap-4 xl:gap-[5.42%]">
      <div className="basis-full lg:basis-1/3">
        <NextPrevAlbum data={data || []} params={params} />

        <div className="mt-6 space-y-4 xl:space-y-10">
          <div className="border border-1 border-grey-500 px-2 lg:px-6 2xl:px-4 py-4 relative flex items-center justify-between">
            <div className="h-[0.5px] w-full bg-grey-500 absolute -mx-2 lg:-mx-6 2xl:-mx-4" />
            <div className="flex flex-col items-center justify-between">
              <p className="uppercase font-bold text-sm text-grey pb-4 text-center">
                artist
              </p>
              <p className="text-grey-700 font-semibold text-sm pt-4 text-center">
                {artiste.name}
              </p>
            </div>
            <div className="flex flex-col items-center justify-between">
              <p className="uppercase font-bold text-sm text-grey pb-4 text-center">
                album title
              </p>
              <p className="hidden truncated-text text-grey-700 font-semibold text-sm pt-4 text-center px-4">
                {album.album_title}
              </p>
              <p className="sm:hidden text-grey-700 font-semibold text-sm pt-4 text-center">
                {truncate(album.album_title, 30)}
              </p>
            </div>
          </div>
          <div className="border border-1 border-grey-500 px-2 lg:px-6 2xl:px-4 py-4 relative flex items-center justify-between">
            <div className="h-[0.5px] w-full bg-grey-500 absolute -mx-2 lg:-mx-6 2xl:-mx-4" />
            <div className="flex flex-col items-center justify-between">
              <p className="uppercase font-bold text-sm text-grey pb-4 text-center">
                year
              </p>
              <p className="text-grey-700 font-semibold text-sm pt-4 text-center">
                {new Date(album.release_date).getFullYear()}
              </p>
            </div>
            <div className="flex flex-col items-center justify-between">
              <p className="uppercase font-bold text-sm text-grey pb-4 text-center">
                genre
              </p>
              <p className="hidden truncated-text text-grey-700 font-semibold text-sm pt-4 text-center px-4">
                {album.genres
                  .map(genre => genre[0].toUpperCase() + genre.slice(1))
                  .join(', ') || '-'}
              </p>
              <p className="sm:hidden text-grey-700 font-semibold text-sm pt-4 text-center">
                {truncate(
                  album.genres
                    .map(genre => genre[0].toUpperCase() + genre.slice(1))
                    .join(', ') || '-',
                  30,
                )}
              </p>
            </div>
          </div>
        </div>

        <p className="hidden lg:inline-block mt-4 xl:mt-6 text-xs text-grey-700 font-medium">
          All album covers are property of their respective artists and record
          labels. We do not have any claim to ownership.
        </p>
      </div>

      <div className="lg:hidden basis-full">
        <Image
          src={album.cover_image}
          alt={album.album_title}
          className="object-cover"
          quality={100}
          width={500}
          height={500}
          priority
        />
      </div>

      <div className="hidden lg:block relative w-[calc(100vw-72.22vw)] h-[calc(100vw-72.22vw)] basis-1/3 group">
        <div className="absolute w-full left-1/2 -translate-x-1/2 z-10 top-1/2 -translate-y-1/2 flex items-center justify-center gap-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <a
            href={album.album_url}
            target="_blank"
            rel="noopener noreferrer"
            className="uppercase text-xs font-semibold text-grey flex items-center bg-white p-2"
          >
            <p>Spotify</p>
            <Image src={external} alt="external" width={24} height={24} />
          </a>
          <a
            href={album.apple_music_url}
            target="_blank"
            rel="noopener noreferrer"
            className="uppercase text-xs font-semibold text-grey flex items-center bg-white p-2"
          >
            <p>Apple Music</p>
            <Image src={external} alt="external" width={24} height={24} />
          </a>
        </div>
        <Image
          src={album.cover_image}
          alt={album.album_title}
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 768px) 30vw, 50vw"
          className="object-cover group-hover:brightness-75 transition-all ease-in-out duration-300"
          quality={100}
          priority
        />
      </div>

      <div className="basis-full lg:basis-1/3 relative">
        <AlbumTable album={album} />

        <p className="mt-6 text-xs text-grey-700 font-medium lg:hidden">
          All album covers are property of their respective artists and record
          labels. We do not have any claim to ownership.
        </p>
      </div>
    </main>
  );
}

export default function AlbumPage(props: {params: Promise<{id: string}>}) {
  return (
    <Suspense fallback={<div className="animate-pulse bg-grey-100 h-64" />}>
      <AlbumContent params={props.params} />
    </Suspense>
  );
}
