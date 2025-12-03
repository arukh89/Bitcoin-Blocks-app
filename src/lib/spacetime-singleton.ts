import { DbConnection } from '@/spacetime_module_bindings'

let connPromise: Promise<DbConnection> | null = null

function normalizeWs(host: string): string {
  let h = host.trim()
  if (h.startsWith('http://')) h = 'ws://' + h.slice('http://'.length)
  if (h.startsWith('https://')) h = 'wss://' + h.slice('https://'.length)
  if (!h.startsWith('ws://') && !h.startsWith('wss://')) h = 'wss://' + h.replace(/^\/+/, '')
  return h
}

export async function getSpacetimeConnection(): Promise<DbConnection> {
  if (!connPromise) {
    const HOST = process.env.NEXT_PUBLIC_SPACETIME_HOST || ''
    const DB_NAME = process.env.NEXT_PUBLIC_SPACETIME_DB_NAME || ''
    if (!HOST || !DB_NAME) throw new Error('SpacetimeDB not configured')
    const wsHost = normalizeWs(HOST)
    connPromise = DbConnection.builder()
      .withUri(wsHost)
      .withModuleName(DB_NAME)
      .build()
      .then((conn) => {
        try { conn.subscriptionBuilder().subscribeToAllTables() } catch {}
        return conn
      })
  }
  return connPromise
}
