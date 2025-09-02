/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-avatar",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "recharts",
      "date-fns"
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    },
    webpackBuildWorker: true,
    optimizeCss: true,
    serverComponentsExternalPackages: ['@prisma/client'],
    ppr: false, // Enable when ready for Partial Prerendering
  },
  
  // Bundle analyzer and optimization
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      };
    }

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          radixui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            priority: 25,
            reuseExistingChunk: true,
          },
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            priority: 20,
            reuseExistingChunk: true,
          },
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*|@nivo)[\\/]/,
            name: 'charts',
            priority: 30,
            reuseExistingChunk: true,
          },
          heavy: {
            test: /[\\/]node_modules[\\/](xlsx|pdf-lib|puppeteer)[\\/]/,
            name: 'heavy-libs',
            priority: 40,
            reuseExistingChunk: true,
          }
        }
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "development"
                ? "*"
                : "https://yourdomain.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, Cookie",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
