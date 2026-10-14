/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [new URL('/assets/**', process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055')],
  },
};

module.exports = nextConfig;
