/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'public.blob.vercel-storage.com' },
    ]
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    }
    return config
  },
  async headers() {
    const envHost = process.env.NEXT_PUBLIC_SPACETIME_HOST || ''
    const stripped = envHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '')
    const wssHost = stripped ? `wss://${stripped}` : ''
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      [
        "connect-src 'self'",
        'https://api.farcaster.xyz',
        'https://api.neynar.com',
        'https://mempool.space',
        'https://*.mempool.space',
        wssHost
      ].filter(Boolean).join(' '),
      "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com"
    ].join('; ')
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
