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
  if (cached) {
    console.log('[Spotify Token] Using cached token');
    return cached;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  console.log('[Spotify Token] Client ID:', clientId ? 'present' : 'missing');
  console.log(
    '[Spotify Token] Client Secret:',
    clientSecret ? 'present' : 'missing',
  );
  if (!clientId || !clientSecret) return null;

  try {
    console.log('[Spotify Token] Fetching new token...');
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
    console.log('[Spotify Token] Response status:', res.status);
    if (!res.ok) {
      const err = await res.text();
      console.log('[Spotify Token] Error:', err);
      return null;
    }
    const data = await res.json();
    const token = data.access_token || null;
    console.log('[Spotify Token] Token obtained:', token ? 'yes' : 'no');
    if (token) {
      cache.set('spotify_token', token, ONE_HOUR_MS);
    }
    return token;
  } catch (e) {
    console.log('[Spotify Token] Fetch error:', e);
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
  console.log('[Spotify Search] URL:', url);
  try {
    const res = await fetch(url, {
      headers: {Authorization: `Bearer ${token}`},
    });

    console.log('[Spotify Search] Status:', res.status, 'Offset:', offset);

    if (res.status === 429 && retries > 0) {
      const retryAfter = res.headers.get('retry-after') || '1';
      console.log(
        '[Spotify Search] Rate limited, retrying after',
        retryAfter,
        'seconds',
      );
      await new Promise(r => setTimeout(r, Number(retryAfter) * 1000));
      return searchSpotify(token, query, offset, retries - 1);
    }

    if (!res.ok) {
      const err = await res.text();
      console.log('[Spotify Search] Error:', err);
      return null;
    }
    const data = await res.json();
    console.log(
      '[Spotify Search] Albums found:',
      data.albums?.items?.length || 0,
    );
    return data;
  } catch (e) {
    console.log('[Spotify Search] Fetch error:', e);
    return null;
  }
}

async function getExistingAlbumKeys(): Promise<Set<string>> {
  const cacheKey = 'existing_albums';
  const cached = cache.get<Set<string>>(cacheKey);
  if (cached) {
    console.log('[Existing Albums] Using cached keys, count:', cached.size);
    return cached;
  }

  console.log('[Existing Albums] Fetching from database...');
  const {data: artists} = await supabase.from('artistes').select('*');
  const keys = new Set<string>();

  artists?.forEach(artist => {
    (artist.albums as Album[])?.forEach(album => {
      keys.add(
        `${album.album_title.toLowerCase()}|${artist.name.toLowerCase()}`,
      );
    });
  });

  console.log('[Existing Albums] Keys loaded:', keys.size);
  cache.set(cacheKey, keys, THREE_DAY_MS);
  return keys;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  console.log('[Search] Query:', q);
  if (!q) {
    return NextResponse.json({error: 'Missing query parameter'}, {status: 400});
  }

  const cacheKey = `spotify_search:${q}`;
  const cachedResults = cache.get<{results: unknown[]}>(cacheKey);
  if (cachedResults?.results) {
    console.log(
      '[Search] Returning cached results, count:',
      cachedResults.results.length,
    );
    return NextResponse.json(cachedResults);
  }

  try {
    const [spotifyToken, existingKeys] = await Promise.all([
      getSpotifyToken(),
      getExistingAlbumKeys(),
    ]);

    if (!spotifyToken) {
      console.log('[Search] No Spotify token available');
      return NextResponse.json(
        {error: 'Spotify token not available'},
        {status: 502},
      );
    }

    console.log('[Search] Starting sequential Spotify searches...');
    const pages: SpotifySearchResponse[] = [];
    for (let offset = 0; offset < 50; offset += 10) {
      const page = await searchSpotify(spotifyToken, q, offset);
      if (page) pages.push(page);
    }

    const allAlbums = pages.flatMap(page => page.albums.items);
    console.log('[Search] Total albums from Spotify:', allAlbums.length);

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

    console.log('[Search] Final results after filtering:', results.length);
    const data = {results};
    cache.set(cacheKey, data, THREE_DAY_MS);
    return NextResponse.json(data);
  } catch (error) {
    console.log('[Search] Error:', error);
    return NextResponse.json(
      {error: 'Failed to search', detail: String(error)},
      {status: 500},
    );
  }
}
