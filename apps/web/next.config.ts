import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kural-sevi/shared', '@kural-sevi/recommendation-engine'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
