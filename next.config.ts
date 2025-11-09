import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Experimental features for better performance
  experimental: {
    // Enable optimizations
    optimizeCss: true,
    webpackBuildWorker: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false, // Security: prevent SVG XSS
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
        ],
      },
    ];
  },

  // TypeScript configuration
  typescript: {
    // Only ignore build errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Output optimization
  output: 'standalone',
  
  // Redirects for security
  async redirects() {
    return [
      // Redirect root to dashboard for authenticated users
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
