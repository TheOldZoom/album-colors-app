import {NextRequest, NextResponse} from 'next/server';
import {cache, THREE_DAY_MS, ONE_HOUR_MS} from '@/helpers/cache';
import {supabase} from '@/utils/supabase';
import {Album} from '@/types';

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: {name: string}[];
  images: {url: string; width: number; height: number}[];
  release_date: string;
  external_urls: {spotify: string};
}

interface SpotifySearchResponse {
  albums: {
    items: SpotifyAlbum[];
    total: number;
    next: string | null;
  };
}

async function getSpotifyToken(): Promise<string | null> {
  const cached = cache.get<string>('spotify_token');
  if (cached) return cached;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`,
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data.access_token || null;
    if (token) {
      cache.set('spotify_token', token, ONE_HOUR_MS);
    }
    return token;
  } catch {
    return null;
  }
}

async function searchSpotify(
  token: string,
  query: string,
  offset: number,
  retries = 2,
): Promise<SpotifySearchResponse | null> {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
    query,
  )}&type=album&limit=10&offset=${offset}`;
  try {
    const res = await fetch(url, {
      headers: {Authorization: `Bearer ${token}`},
    });

    if (res.status === 429 && retries > 0) {
      const retryAfter = res.headers.get('retry-after') || '1';
      await new Promise(r => setTimeout(r, Number(retryAfter) * 1000));
      return searchSpotify(token, query, offset, retries - 1);
    }

    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

async function getExistingAlbumKeys(): Promise<Set<string>> {
  const cacheKey = 'existing_albums';
  const cached = cache.get<Set<string>>(cacheKey);
  if (cached) return cached;

  const {data: artists} = await supabase.from('artistes').select('*');
  const keys = new Set<string>();

  artists?.forEach(artist => {
    (artist.albums as Album[])?.forEach(album => {
      keys.add(
        `${album.album_title.toLowerCase()}|${artist.name.toLowerCase()}`,
      );
    });
  });

  cache.set(cacheKey, keys, THREE_DAY_MS);
  return keys;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({error: 'Missing query parameter'}, {status: 400});
  }

  const cacheKey = `spotify_search:${q}`;
  const cachedResults = cache.get<{results: unknown[]}>(cacheKey);
  if (cachedResults?.results) {
    return NextResponse.json(cachedResults);
  }

  try {
    const [spotifyToken, existingKeys] = await Promise.all([
      getSpotifyToken(),
      getExistingAlbumKeys(),
    ]);

    if (!spotifyToken) {
      return NextResponse.json(
        {error: 'Spotify token not available'},
        {status: 502},
      );
    }

    const pages: SpotifySearchResponse[] = [];
    for (let offset = 0; offset < 50; offset += 10) {
      const page = await searchSpotify(spotifyToken, q, offset);
      if (page) pages.push(page);
    }

    const allAlbums = pages.flatMap(page => page.albums.items);

    const seen = new Set<string>();
    const results = allAlbums
      .filter(album => {
        const artistName = album.artists.map(a => a.name).join(', ');
        const key = `${album.name.toLowerCase()}|${artistName.toLowerCase()}`;
        if (seen.has(key) || existingKeys.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 50)
      .map(album => {
        const coverImage =
          album.images.find(img => img.width === 300)?.url ||
          album.images.find(img => img.width === 64)?.url ||
          album.images[0]?.url ||
          '';

        return {
          id: album.id,
          title: album.name,
          artist: album.artists.map(a => a.name).join(', '),
          coverImage,
          releaseDate: album.release_date || '',
          spotifyUrl: album.external_urls.spotify,
        };
      });

    const data = {results};
    cache.set(cacheKey, data, THREE_DAY_MS);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {error: 'Failed to search', detail: String(error)},
      {status: 500},
    );
  }
}
