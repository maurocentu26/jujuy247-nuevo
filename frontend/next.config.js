/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.js',
    deviceSizes: [400, 800, 1200],
    imageSizes: [64],
  },
};

module.exports = nextConfig;
