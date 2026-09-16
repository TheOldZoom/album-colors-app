'use client';

import {useSearchParams, useRouter} from 'next/navigation';
import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Album, Artist} from '@/types';
import Pagination from './pagination';

const ITEMS_PER_PAGE = 6;

interface iTunesResult {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  releaseDate: string;
  spotifyUrl: string;
}

export default function SearchClient({data}: {data: Artist[]}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get('q') || '';

  const [itResults, setItResults] = useState<iTunesResult[]>([]);
  const [itLoading, setItLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [localPage, setLocalPage] = useState(1);
  const [itunesPage, setItunesPage] = useState(1);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchiTunes = useCallback(async (query: string) => {
    if (query.length < 2) {
      setItResults([]);
      return;
    }

    setItLoading(true);
    try {
      const res = await fetch(
        `/api/search-spotify?q=${encodeURIComponent(query)}`,
      );
      const json = await res.json();
      setItResults(json.results || []);
    } catch {
      setItResults([]);
    } finally {
      setItLoading(false);
    }
  }, []);

  useEffect(() => {
    setLocalPage(1);
    setItunesPage(1);
    setShowCreateNew(false);
    setItResults([]);
  }, [searchQuery]);

  const handleCreateNew = () => {
    setShowCreateNew(true);
    if (searchQuery.length >= 2) {
      fetchiTunes(searchQuery);
    }
  };

  const handleAdd = async (result: iTunesResult) => {
    setAddingId(result.id);
    try {
      const res = await fetch('/api/create-album', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: result.id}),
      });
      if (res.status === 409) {
        setToast('Album already exists');
        setTimeout(() => setToast(null), 3000);
        setAddingId(null);
        return;
      }
      const json = await res.json();
      if (json.album) {
        router.push(`/album/${json.album.album_id}`);
      }
    } catch {
      setAddingId(null);
    }
  };

  const filteredData = data
    ?.map(artist => {
      const artistName = artist.name.toLowerCase();
      const isArtistMatch = artistName.includes(searchQuery.toLowerCase());

      if (isArtistMatch) {
        return artist;
      } else {
        const matchingAlbums = artist.albums.filter(album =>
          album.album_title.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        if (matchingAlbums.length > 0) {
          return {
            ...artist,
            albums: matchingAlbums,
          };
        }
      }

      return null;
    })
    .filter(Boolean);

  const hasLocalResults =
    searchQuery.length > 0 && filteredData && filteredData.length > 0;

  const flatLocalAlbums = useMemo(() => {
    const rows: {artist: Artist; album: Album}[] = [];
    filteredData
      ?.filter((artist: Artist | null): artist is Artist => artist !== null)
      .forEach((artist: Artist) => {
        artist.albums.forEach((album: Album) => {
          rows.push({artist, album});
        });
      });
    return rows;
  }, [filteredData]);

  const localTotalPages = Math.ceil(flatLocalAlbums.length / ITEMS_PER_PAGE);
  const localStart = (localPage - 1) * ITEMS_PER_PAGE;
  const localCurrent = flatLocalAlbums.slice(
    localStart,
    localStart + ITEMS_PER_PAGE,
  );

  const itunesTotalPages = Math.ceil(itResults.length / ITEMS_PER_PAGE);
  const itunesStart = (itunesPage - 1) * ITEMS_PER_PAGE;
  const itunesCurrent = itResults.slice(
    itunesStart,
    itunesStart + ITEMS_PER_PAGE,
  );

  return (
    <>
      {searchQuery.length > 0 ? (
        <>
          {hasLocalResults && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localCurrent.map(({artist, album}) => (
                  <Link
                    href={`/album/${album.album_id}`}
                    className="relative max-w-[calc(100vw-0vw)] h-[calc(100vw-0vw)] w-full sm:max-w-[calc(100vw-52.5vw)] lg:max-w-[calc(100vw-62.8vw)] sm:h-[calc(100vw-50vw)] lg:h-[calc(100vw-63.6vw)] bg-grey-500 rounded"
                    key={album.album_id}
                  >
                    <Image
                      src={album.cover_image}
                      alt={album.album_title}
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 30vw, 50vw"
                      className="rounded object-cover"
                      quality={100}
                      fill
                    />
                  </Link>
                ))}
              </div>
              <Pagination
                currentPage={localPage}
                totalPages={localTotalPages}
                onPageChange={setLocalPage}
              />
            </>
          )}

          {!showCreateNew && (
            <button
              onClick={handleCreateNew}
              className="uppercase text-xs font-bold text-grey border border-grey-500 px-4 py-2 hover:bg-grey-500 hover:text-white transition-colors mt-8"
            >
              Create new
            </button>
          )}

          {showCreateNew && (
            <div className="mt-8">
              <h2 className="uppercase font-bold text-sm text-grey mb-4">
                Create new
              </h2>

              {itLoading && (
                <div className="text-grey text-sm animate-pulse">
                  Searching Spotify...
                </div>
              )}

              {!itLoading && itunesCurrent.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itunesCurrent.map(result => (
                      <div
                        key={result.id}
                        className="relative h-[calc(100vw-50vw)] sm:h-[calc(100vw-52.5vw)] lg:h-[calc(100vw-63.6vw)] bg-grey-500 rounded overflow-hidden group"
                      >
                        <Image
                          src={result.coverImage}
                          alt={result.title}
                          sizes="(min-width: 1024px) 20vw, (min-width: 768px) 30vw, 50vw"
                          className="rounded object-cover"
                          quality={100}
                          fill
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-4">
                          <p className="text-white text-sm font-bold text-center">
                            {result.title}
                          </p>
                          <p className="text-white/70 text-xs text-center">
                            {result.artist}
                          </p>
                          <button
                            onClick={() => handleAdd(result)}
                            disabled={addingId === result.id}
                            className="mt-2 uppercase text-xs font-bold bg-white text-grey px-4 py-2 hover:bg-grey-500 hover:text-white transition-colors disabled:opacity-30"
                          >
                            {addingId === result.id ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={itunesPage}
                    totalPages={itunesTotalPages}
                    onPageChange={setItunesPage}
                  />
                </>
              )}

              {!itLoading &&
                itResults.length === 0 &&
                searchQuery.length >= 2 && (
                  <p className="text-grey text-sm">No results found.</p>
                )}
            </div>
          )}
        </>
      ) : (
        <p className="text-grey">You haven&apos;t searched for anything yet.</p>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-grey text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </>
  );
}
