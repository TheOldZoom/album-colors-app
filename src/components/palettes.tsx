'use client';

import {useState} from 'react';
import {hexToRgb} from '@/helpers/hex-to-rgb';
import {Album, Artist} from '@/types';
import Wrapper from './wrapper';

export default function Palettes({
  allAlbums,
  data,
}: {
  allAlbums: Album[];
  data: Artist[];
}) {
  const initialCopiedStates =
    allAlbums.length > 0 ? Array(allAlbums[0].palettes.length).fill(false) : [];

  const [currentPaletteIndex, setCurrentPaletteIndex] = useState(0);
  const [copiedStates, setCopiedStates] =
    useState<boolean[]>(initialCopiedStates);

  if (allAlbums.length === 0) {
    return (
      <Wrapper>
        <div className="mt-6 text-center text-grey text-sm">
          <p className="uppercase font-bold mb-2">No albums found</p>
        </div>
      </Wrapper>
    );
  }

  const currentAlbum = allAlbums[currentPaletteIndex];

  const nextPalette = () => {
    setCopiedStates(initialCopiedStates);

    if (currentPaletteIndex < allAlbums.length - 1) {
      setCurrentPaletteIndex(currentPaletteIndex + 1);
    } else {
      setCurrentPaletteIndex(0);
    }
  };

  const previousPalette = () => {
    setCopiedStates(initialCopiedStates);

    if (currentPaletteIndex > 0) {
      setCurrentPaletteIndex(currentPaletteIndex - 1);
    } else {
      setCurrentPaletteIndex(allAlbums.length - 1);
    }
  };

  function generateCSSCode(
    artistName: string,
    albumTitle: string,
    palettes: string[],
  ) {
    let cssCode = `/* Custom CSS Palette for ${artistName} - ${albumTitle} */\n\n`;

    for (let i = 0; i < palettes.length; i++) {
      const palette = palettes[i];
      const colorNumber = i + 1;

      cssCode += `/* Color ${colorNumber}\n`;
      cssCode += `--color-${colorNumber}-hex: ${palette};\n`;
      cssCode += `--color-${colorNumber}-rgb: rgb(${hexToRgb(palette)});\n\n`;
    }

    return cssCode;
  }

  function downloadTXTFile(
    cssCode: string,
    artistName: string,
    albumTitle: string,
  ) {
    const fileName = `${artistName
      .toLowerCase()
      .replace(/\s+/g, '-')}-${albumTitle
      .toLowerCase()
      .replace(/\s+/g, '-')}-palette.txt`;

    const blob = new Blob([cssCode], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleDownload = () => {
    const artist = data.find(artist =>
      artist.albums.some(album => album.album_id === currentAlbum.album_id),
    );
    const cssCode = generateCSSCode(
      artist?.name as string,
      currentAlbum.album_title,
      currentAlbum.palettes,
    );

    if (artist) {
      downloadTXTFile(cssCode, artist.name, currentAlbum.album_title);
    }
  };

  const handleCopy = (paletteIndex: number) => {
    const palette = currentAlbum.palettes[paletteIndex];
    navigator.clipboard.writeText(palette);
    setCopiedStates(prevState => {
      const newState = [...prevState];
      newState[paletteIndex] = true;
      return newState;
    });

    setTimeout(() => {
      setCopiedStates(prevState => {
        const newState = [...prevState];
        newState[paletteIndex] = false;
        return newState;
      });
    }, 1500);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 sm:gap-9 justify-end text-grey text-xs font-bold">
        <button onClick={nextPalette} className="uppercase">
          next palette
        </button>
        <button onClick={previousPalette} className="uppercase">
          previous palette
        </button>
        <button onClick={handleDownload} className="uppercase">
          download
        </button>
      </div>

      <Wrapper>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-9 md:h-[calc(100vw-75.694vw)]">
          {currentAlbum.palettes.map((palette, index) => (
            <div
              key={index}
              className="w-full h-24 md:h-full rounded relative cursor-pointer group"
              style={{backgroundColor: palette}}
              tabIndex={0}
              onClick={() => handleCopy(index)}
            >
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 uppercase opacity-0 transition-opacity duration-300 ${
                  copiedStates[index] ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <p className="text-xs sm:text-sm font-semibold">copied</p>
              </div>
              <div className="absolute bottom-2 lg:bottom-5 left-2 lg:left-5 right-2 lg:right-5 space-y-4 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                <div className="flex flex-wrap items-center justify-between uppercase text-xs sm:text-sm font-semibold text-white">
                  <p>HEX</p>
                  <p>{palette.replace('#', '').toUpperCase()}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between uppercase text-xs sm:text-sm font-semibold text-white">
                  <p>RGB</p>
                  <p>{hexToRgb(palette)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Wrapper>
    </>
  );
}
