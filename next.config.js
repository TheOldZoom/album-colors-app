/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  serverExternalPackages: ['sharp'],
  images: {
    domains: ['i.scdn.co', 'is1-ssl.mzstatic.com'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
