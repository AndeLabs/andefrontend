import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Optimize for production (disabled in Docker due to critters dependency)
  experimental: {
    optimizeCss: process.env.DOCKER_BUILD !== 'true',
  },
  
  // Compress output
  compress: true,
  
  // Power by header removal for security
  poweredByHeader: false,
  
  // RPC Proxy for Docker networking
  async rewrites() {
    return [
      {
        source: '/api/rpc',
        destination: 'http://ande-ev-reth:8545',
      },
      {
        source: '/api/ws',
        destination: 'http://ande-ev-reth:8546',
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
