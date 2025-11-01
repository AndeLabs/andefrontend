import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Show errors in production
  },
  eslint: {
    ignoreDuringBuilds: false, // Show errors in production
  },
  
  // Only use standalone for Docker builds
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),
  
  // Optimize for production
  experimental: {
    optimizeCss: process.env.DOCKER_BUILD !== 'true',
  },
  
  // Compress output
  compress: true,
  
  // Power by header removal for security
  poweredByHeader: false,
  
  // Webpack configuration for proper module resolution
  webpack: (config, { isServer }) => {
    // Alias configuration for @/ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    
    // Ignore optional dependencies that cause build issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Ignore missing optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/pino/ },
      { module: /node_modules\/pino-pretty/ },
    ];
    
    return config;
  },
  
  // RPC Proxy - only for Docker, Vercel uses /api/rpc route
  ...(process.env.DOCKER_BUILD === 'true' && {
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
  }),
  
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
