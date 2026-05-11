/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'kargoone.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.aftership.com',
      },
    ],
  },
};

export default nextConfig;
