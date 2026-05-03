const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  eslint: {
    // Some Windows / locked-down environments block child-process spawning during build.
    // We keep ESLint in dev/CI, but avoid failing production builds here.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Avoid build failure when the environment blocks Next's type-check worker spawning.
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,

  experimental: {
    turbo: {
      resolveAlias: {
        '@/*': ['./*'],
        '@/components/*': ['./components/*'],
        '@/lib/*': ['./lib/*'],
        '@/app/*': ['./app/*'],
      },
    },
  },

  webpack(config, { dev }) {
    if (dev) {
      // Use native watchers for better performance on Windows
      config.watchOptions = {
        aggregateTimeout: 200, 
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 3600 * 1000, // Keep in memory for 1 hour
    pagesBufferLength: 50, // Increase buffer
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { 
            key: "Content-Security-Policy", 
            value: "default-src * 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' * blob: data:; img-src * data: blob:; style-src 'self' 'unsafe-inline' *; connect-src *; font-src * data:;" 
          },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
