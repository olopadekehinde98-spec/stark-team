import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'worker',
  workboxOptions: {
    disableDevLogs: true,
  },
})

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
  async headers() {
    return [
      {
        // Cache Next.js static chunks for 1 year (they're content-hashed)
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Cache public assets (images, icons, fonts) for 7 days
        source: '/(.*)\\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)$',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        // Preconnect hint for all app pages — browser opens Supabase socket early
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: [
              `<${process.env.NEXT_PUBLIC_SUPABASE_URL}>; rel=preconnect`,
              `<${process.env.NEXT_PUBLIC_SUPABASE_URL}>; rel=dns-prefetch`,
            ].join(', '),
          },
        ],
      },
    ]
  },
}

export default withPWA(nextConfig)
