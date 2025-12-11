/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure TS/ESM inside node_modules/spacetimedb is transpiled by Next.js
  transpilePackages: ['spacetimedb'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
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
    const explicitHosts = []
    if (stripped) {
      // Allow both ws:// and wss:// forms for the configured host
      explicitHosts.push(`ws://${stripped}`)
      explicitHosts.push(`wss://${stripped}`)
    }

    const connectSrcArr = [
      "'self'",
      'https://api.farcaster.xyz',
      'https://api.neynar.com',
      'https://mempool.space',
      'https://*.mempool.space',
      ...explicitHosts,
    ]

    // In development, allow all ws/wss (local dev servers)
    if (process.env.NODE_ENV !== 'production') {
      connectSrcArr.push('ws:')
      connectSrcArr.push('wss:')
      connectSrcArr.push('ws://localhost:*')
      connectSrcArr.push('wss://localhost:*')
      connectSrcArr.push('ws://127.0.0.1:*')
      connectSrcArr.push('wss://127.0.0.1:*')
    }

    const connectSrc = connectSrcArr.filter(Boolean).join(' ')

    const csp = [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://farcaster.xyz https://*.farcaster.xyz",
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
