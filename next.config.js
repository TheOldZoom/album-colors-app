/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  images: {
    domains: ['i.scdn.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
