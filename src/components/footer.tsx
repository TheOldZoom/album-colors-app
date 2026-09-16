async function CopyrightYear() {
  'use cache';
  return <>{new Date().getFullYear()}</>;
}

export default function Footer() {
  return (
    <footer className="pt-10 mt-auto md:mt-20 relative flex items-center justify-between text-grey text-sm font-bold uppercase flex-wrap sm:flex-nowrap gap-4 sm:gap-0">
      <p>ALBUM COLORS</p>
      <div className="space-x-4 sm:space-x-9 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
        <a
          href="https://www.instagram.com/thealbumcolors/"
          target="_blank"
          rel="noopener noreferrer"
        >
          INSTAGRAM
        </a>
        <a
          href="https://twitter.com/thealbumcolors"
          target="_blank"
          rel="noopener noreferrer"
        >
          TWITTER
        </a>
      </div>
      <p>
        © <CopyrightYear /> ALL RIGHTS RESERVED
      </p>
    </footer>
  );
}
