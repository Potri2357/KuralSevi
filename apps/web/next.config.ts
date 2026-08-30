import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kural-sevi/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
