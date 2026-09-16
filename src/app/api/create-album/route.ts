import {NextRequest, NextResponse} from 'next/server';
import {supabase} from '@/utils/supabase';
import {Album} from '@/types';
import {cache, THREE_DAY_MS, ONE_HOUR_MS} from '@/helpers/cache';

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: {name: string}[];
  images: {url: string; width: number; height: number}[];
  release_date: string;
  external_urls: {spotify: string};
}

async function extractColorsFromUrl(imageUrl: string): Promise<string[]> {
  const {extractColors} = await import('@/helpers/extract-colors');
  return extractColors(imageUrl);
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

async function lookupSpotifyAlbum(id: string): Promise<SpotifyAlbum | null> {
  const cacheKey = `spotify_album:${id}`;
  const cached = cache.get<SpotifyAlbum>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      headers: {Authorization: `Bearer ${token}`},
    });
    if (!res.ok) return null;
    const album: SpotifyAlbum = await res.json();
    cache.set(cacheKey, album, THREE_DAY_MS);
    return album;
  } catch {
    return null;
  }
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string): number {
  const aNorm = normalize(a);
  const bNorm = normalize(b);
  if (aNorm === bNorm) return 1;

  const aWords = aNorm.split(' ');
  const bWords = bNorm.split(' ');
  const common = aWords.filter(w => bWords.includes(w)).length;
  const wordScore = common / Math.max(aWords.length, bWords.length);

  const longer = aNorm.length > bNorm.length ? aNorm : bNorm;
  const shorter = aNorm.length > bNorm.length ? bNorm : aNorm;
  const containsBonus =
    longer.startsWith(shorter) || longer.endsWith(shorter) ? 0.3 : 0;
  const substringPenalty =
    longer.includes(shorter) && !containsBonus ? -0.2 : 0;

  return Math.max(0, wordScore + containsBonus + substringPenalty);
}

async function searchAppleMusicData(
  title: string,
  artist: string,
): Promise<{url: string; genres: string[]}> {
  const cacheKey = `apple:${title}:${artist}`;
  const cached = cache.get<{url: string; genres: string[]}>(cacheKey);
  if (cached) return cached;

  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=album&limit=50`,
    );
    if (!res.ok) return {url: '', genres: []};
    const data = await res.json();

    let bestMatch = null;
    let bestScore = 0;

    for (const album of data.results || []) {
      const titleScore = similarity(title, album.collectionName);
      const artistScore = similarity(artist, album.artistName);
      const score = titleScore * 0.6 + artistScore * 0.4;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = album;
      }
    }

    if (!bestMatch || bestScore < 0.6) return {url: '', genres: []};

    const result = {
      url: bestMatch.collectionViewUrl || '',
      genres: bestMatch.primaryGenreName ? [bestMatch.primaryGenreName] : [],
    };
    cache.set(cacheKey, result, THREE_DAY_MS);
    return result;
  } catch {
    return {url: '', genres: []};
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {id} = body;

  if (!id) {
    return NextResponse.json({error: 'Album ID is required'}, {status: 400});
  }

  const spotifyAlbum = await lookupSpotifyAlbum(id);
  if (!spotifyAlbum) {
    return NextResponse.json(
      {error: 'Album not found on Spotify'},
      {status: 404},
    );
  }

  const coverImage =
    spotifyAlbum.images.find(img => img.width === 300)?.url ||
    spotifyAlbum.images.find(img => img.width === 64)?.url ||
    spotifyAlbum.images[0]?.url ||
    '';

  const {data: allArtists} = await supabase.from('artistes').select('*');

  const artistName = spotifyAlbum.artists.map(a => a.name).join(', ');
  const existingAlbum = allArtists?.some(artist => {
    if (artist.name.toLowerCase() !== artistName.toLowerCase()) return false;
    return (artist.albums as Album[])?.some(
      (album: Album) =>
        album.album_title.toLowerCase() === spotifyAlbum.name.toLowerCase(),
    );
  });

  if (existingAlbum) {
    return NextResponse.json(
      {error: 'Album already exists in the database'},
      {status: 409},
    );
  }

  const paletteResult = await extractColorsFromUrl(coverImage).catch(
    () => null,
  );

  const palettes = paletteResult || [
    '#cccccc',
    '#999999',
    '#666666',
    '#333333',
    '#111111',
  ];

  const albumIdStr = `mb-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  const appleMusicData = await searchAppleMusicData(
    spotifyAlbum.name,
    artistName,
  );

  const newAlbum: Album = {
    album_id: albumIdStr,
    album_title: spotifyAlbum.name,
    cover_image: coverImage,
    release_date: spotifyAlbum.release_date || '',
    palettes,
    genres: appleMusicData.genres,
    album_url: spotifyAlbum.external_urls.spotify || '',
    apple_music_url: appleMusicData.url,
  };

  const {data: existingArtists, error: searchError} = await supabase
    .from('artistes')
    .select('*')
    .ilike('name', artistName)
    .limit(1);

  if (searchError) {
    return NextResponse.json({error: searchError.message}, {status: 500});
  }

  if (existingArtists && existingArtists.length > 0) {
    const existing = existingArtists[0];
    const currentAlbums = (existing.albums as Album[]) || [];
    const updatedAlbums = [...currentAlbums, newAlbum];

    const {data, error} = await supabase
      .from('artistes')
      .update({albums: updatedAlbums, updated_at: new Date().toISOString()})
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }

    cache.delete('existing_albums');
    return NextResponse.json({album: newAlbum, artist: data});
  }

  const {data: newArtist, error} = await supabase
    .from('artistes')
    .insert({
      name: artistName,
      albums: [newAlbum],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({error: error.message}, {status: 500});
  }

  cache.delete('existing_albums');
  return NextResponse.json({album: newAlbum, artist: newArtist});
}
