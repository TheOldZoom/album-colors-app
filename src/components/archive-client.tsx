'use client';

import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Album, Artist} from '@/types';
import Pagination from './pagination';

const ITEMS_PER_PAGE = 20;

type SortKey =
  | 'artist-asc'
  | 'artist-desc'
  | 'album-asc'
  | 'album-desc'
  | 'year-asc'
  | 'year-desc';

const SORT_OPTIONS: {key: SortKey; label: string}[] = [
  {key: 'artist-asc', label: 'Artist A-Z'},
  {key: 'artist-desc', label: 'Artist Z-A'},
  {key: 'album-asc', label: 'Album A-Z'},
  {key: 'album-desc', label: 'Album Z-A'},
  {key: 'year-desc', label: 'Newest'},
  {key: 'year-asc', label: 'Oldest'},
];

interface AlbumRow {
  artist: string;
  album: Album;
}

function sortAlbums(rows: AlbumRow[], sort: SortKey): AlbumRow[] {
  const sorted = [...rows];
  switch (sort) {
    case 'artist-asc':
      return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
    case 'artist-desc':
      return sorted.sort((a, b) => b.artist.localeCompare(a.artist));
    case 'album-asc':
      return sorted.sort((a, b) =>
        (a.album?.album_title || '').localeCompare(b.album?.album_title || ''),
      );
    case 'album-desc':
      return sorted.sort((a, b) =>
        (b.album?.album_title || '').localeCompare(a.album?.album_title || ''),
      );
    case 'year-asc':
      return sorted.sort((a, b) =>
        (a.album?.release_date || '').localeCompare(
          b.album?.release_date || '',
        ),
      );
    case 'year-desc':
      return sorted.sort((a, b) =>
        (b.album?.release_date || '').localeCompare(
          a.album?.release_date || '',
        ),
      );
  }
}

export default function ArchiveClient({data}: {data: Artist[]}) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [minHeight, setMinHeight] = useState<number>();
  const [sort, setSort] = useState<SortKey>('year-desc');
  const rowContainerRef = useRef<HTMLDivElement>(null);

  const allAlbums = useMemo(() => {
    const rows: AlbumRow[] = [];
    data?.forEach(artist => {
      artist.albums.forEach(album => {
        rows.push({artist: artist.name, album});
      });
    });
    return sortAlbums(rows, sort);
  }, [data, sort]);

  const totalPages = Math.ceil(allAlbums.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAlbums = allAlbums.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleScroll = () => {
    const position = window.scrollY;
    setScrollPosition(position);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollPosition]);

  useLayoutEffect(() => {
    if (!rowContainerRef.current) return;
    const height = rowContainerRef.current.scrollHeight;
    setMinHeight(prev => (prev ? Math.max(prev, height) : height));
  }, [currentAlbums]);

  return (
    <div className="flex flex-col basis-full">
      <div className="flex flex-wrap gap-2 mb-4">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => {
              setSort(opt.key);
              setCurrentPage(1);
            }}
            className={`uppercase text-xs font-bold px-4 py-2 border transition-colors ${
              sort === opt.key
                ? 'bg-grey text-white border-grey'
                : 'text-grey border-grey-500 hover:bg-grey-500 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div
        ref={rowContainerRef}
        className="flex basis-full"
        style={{minHeight}}
      >
        <table className="w-full basis-full sm:basis-[54.7%] border-separate -mt-6 border-spacing-y-6">
          <thead>
            <tr>
              <th className="uppercase font-bold text-sm text-grey">Artist</th>
              <th className="uppercase font-bold text-sm text-grey">
                Album Title
              </th>
              <th className="uppercase font-bold text-sm text-grey">Year</th>
            </tr>
          </thead>
          <tbody>
            {currentAlbums.map(({artist, album}) => (
              <tr key={album?.album_id} className="group">
                <td className="max-w-0">
                  <Link
                    className="flex items-center justify-center text-grey-800 font-medium text-sm text-center group-hover:text-grey group-hover:font-bold transition-all ease-out duration-[350ms] truncate"
                    href={`/album/${album?.album_id}`}
                  >
                    {artist}
                  </Link>
                </td>
                <td className="max-w-0">
                  <Link
                    className="flex items-center justify-center text-grey-800 font-medium text-sm text-center group-hover:text-grey group-hover:font-bold transition-all ease-out duration-[350ms] truncate"
                    href={`/album/${album?.album_id}`}
                  >
                    {album?.album_title || '-'}
                  </Link>
                </td>
                <td>
                  <Link
                    className="flex items-center justify-center text-grey-800 font-medium text-sm text-center group-hover:text-grey group-hover:font-bold transition-all ease-out duration-[350ms]"
                    href={`/album/${album?.album_id}`}
                  >
                    {album?.release_date?.split('-')[0] || '-'}
                  </Link>
                </td>
                <td className="hidden sm:block pointer-events-none">
                  <div
                    className={`fixed ${
                      scrollPosition > 0 ? 'bottom-[13.9%]' : 'bottom-0'
                    } right-[4.5%] w-[calc(100vw-72.22vw)] h-[calc(100vw-68.75vw)] opacity-0 group-hover:opacity-100 transition-opacity ease-in duration-[350ms]`}
                  >
                    <Image
                      src={album?.cover_image}
                      alt={album?.album_title}
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 30vw, 50vw"
                      fill
                      quality={100}
                      className="rounded object-cover"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
