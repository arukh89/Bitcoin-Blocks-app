// Real SpacetimeDB client connection using official SDK (client-only)
import 'client-only'
import type { DbConnection as DbConnType, ErrorContext } from '@/spacetime_module_bindings'
import type { Identity } from 'spacetimedb'

// SpacetimeDB connection settings
// IMPORTANT: Module must be published to SpacetimeDB Maincloud using CLI
// Using Maincloud (production-ready database)
// Instructions: See DEPLOYMENT_GUIDE.md
const SPACETIME_HOST = process.env.NEXT_PUBLIC_SPACETIME_HOST
const SPACETIME_DB_NAME = process.env.NEXT_PUBLIC_SPACETIME_DB_NAME

if (!SPACETIME_HOST) {
  throw new Error('Missing env: NEXT_PUBLIC_SPACETIME_HOST')
}
if (!SPACETIME_DB_NAME) {
  throw new Error('Missing env: NEXT_PUBLIC_SPACETIME_DB_NAME')
}

function normalizeWsHost(input: string): string {
  let h = input.trim()
  if (h.startsWith('http://')) h = 'ws://' + h.slice('http://'.length)
  if (h.startsWith('https://')) h = 'wss://' + h.slice('https://'.length)
  // Upgrade ws->wss in non-local environments
  const isLocal = /^(ws:\/\/|wss:\/\/)?(localhost|127\.0\.0\.1)/i.test(h)
  if (h.startsWith('ws://') && !isLocal) h = 'wss://' + h.slice('ws://'.length)
  if (!h.startsWith('ws://') && !h.startsWith('wss://')) {
    // Assume host without scheme; default to wss
    h = 'wss://' + h.replace(/^\/+/, '')
  }
  if (!isLocal && !h.startsWith('wss://')) {
    throw new Error('NEXT_PUBLIC_SPACETIME_HOST must use wss:// in production')
  }
  return h
}

// Narrow to string after runtime guards
const HOST = normalizeWsHost(SPACETIME_HOST as string)
const DB_NAME = SPACETIME_DB_NAME as string

let dbConnection: DbConnType | null = null
let isConnecting = false
let connectionError: string | null = null
let retryCount = 0
const MAX_RETRIES = 3

export async function connectToSpacetime(opts?: {
  onConnect?: () => void
  onDisconnect?: () => void
}): Promise<DbConnType> {
  if (typeof window === 'undefined') {
    throw new Error('Spacetime client can only run in the browser')
  }
  // Return existing connection if available
  if (dbConnection) {
    console.log('♻️ Reusing existing SpacetimeDB connection')
    return dbConnection
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('⏳ Connection already in progress, waiting...')
    // Wait for existing connection attempt
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (dbConnection) return dbConnection
    if (connectionError) throw new Error(connectionError)
  }

  try {
    isConnecting = true
    connectionError = null
    console.log('🔌 Connecting to SpacetimeDB...')
    console.log('Host:', HOST)
    console.log('Database:', DB_NAME)
    console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES + 1}`)
    
    // Set timeout for connection
    const connectionTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    })

    const { DbConnection } = await import('@/spacetime_module_bindings')
    const connectionPromise = DbConnection.builder()
      .withUri(HOST)
      .withModuleName(DB_NAME)
      .onConnect((_connection: DbConnType, identity: Identity, _token: string) => {
        console.log('✅ Connected to SpacetimeDB')
        console.log('Identity:', identity)
        retryCount = 0 // Reset retry count on successful connection
        connectionError = null
        try { opts?.onConnect?.() } catch (e) { console.warn('onConnect callback error', e) }
      })
      .onDisconnect((_ctx: ErrorContext, _error?: Error) => {
        console.log('❌ Disconnected from SpacetimeDB')
        dbConnection = null
        try { opts?.onDisconnect?.() } catch (e) { console.warn('onDisconnect callback error', e) }
      })
      .build()
    
    const conn = await Promise.race([connectionPromise, connectionTimeout])
    
    dbConnection = conn
    console.log('🎉 SpacetimeDB connection established!')
    console.log('📊 Module info:', {
      host: HOST,
      database: DB_NAME
    })
    return conn
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    connectionError = errorMsg
    
    console.error('❌ Failed to connect to SpacetimeDB:', error)
    
    // Provide helpful error messages
    const isMaincloud = HOST.includes('maincloud')
    const isTestnet = HOST.includes('testnet')
    
    if (errorMsg.includes('timeout')) {
      console.error('\n⚠️ CONNECTION TIMEOUT')
      console.error(`The SpacetimeDB module may not be published to ${isMaincloud ? 'maincloud' : isTestnet ? 'testnet' : 'the server'}.`)
    } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      console.error('\n⚠️ MODULE NOT FOUND')
      console.error(`Module "${SPACETIME_DB_NAME}" does not exist on ${SPACETIME_HOST}`)
    } else if (errorMsg.includes('WebSocket')) {
      console.error('\n⚠️ WEBSOCKET ERROR')
      console.error('Unable to establish WebSocket connection to SpacetimeDB')
    }
    
    console.error('\n📖 TO FIX THIS:')
    console.error(`1. Install SpacetimeDB CLI: curl --proto '=https' --tlsv1.2 -sSf https://install.spacetimedb.com | sh`)
    
    if (isMaincloud) {
      console.error('2. Publish to maincloud: cd spacetime-server && spacetime publish', DB_NAME, '--server maincloud')
    } else if (isTestnet) {
      console.error('2. Publish to testnet: cd spacetime-server && spacetime publish --host testnet.spacetimedb.com', DB_NAME)
    } else {
      console.error('2. Publish module: cd spacetime-server && spacetime publish', DB_NAME)
      console.error('3. Or use a local instance: spacetime start')
    }
    
    console.error('\nFor detailed instructions, see: DEPLOYMENT_GUIDE.md\n')
    
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    
    throw new Error(`SpacetimeDB connection failed: ${errorMsg}`)
  } finally {
    isConnecting = false
  }
}

export function getDbConnection(): DbConnType | null {
  return dbConnection
}

export function getConnectionError(): string | null {
  return connectionError
}

export function isConnectionReady(): boolean {
  return dbConnection !== null && !isConnecting
}

export type { DbConnType as DbConnection }
