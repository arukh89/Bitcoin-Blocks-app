# Environment Variable Consolidation Summary

## Changes Made

### 1. Removed `AUTH_DOMAIN` ✅
**Before:**
```
NEXT_PUBLIC_APP_URL=https://bitcoin-blocks-app.vercel.app
AUTH_DOMAIN=bitcoin-blocks-app.vercel.app
```

**After:**
```
NEXT_PUBLIC_APP_URL=https://bitcoin-blocks-app.vercel.app
# AUTH_DOMAIN is now derived automatically from NEXT_PUBLIC_APP_URL
```

**Files Updated:**
- `src/app/api/auth/me/route.ts` - Now extracts domain from `NEXT_PUBLIC_APP_URL`
- `src/lib/admin-auth.ts` - Now extracts domain from `NEXT_PUBLIC_APP_URL`
- `.env.example` - Removed `AUTH_DOMAIN`

---

### 2. Consolidated `FARCASTER_API_KEY` into `NEYNAR_API_KEY` ✅
**Before:**
```
NEYNAR_API_KEY=xxx  # Used for resolve-by-address
FARCASTER_API_KEY=xxx  # Used for auth/me
```

**After:**
```
NEYNAR_API_KEY=xxx  # Used for ALL Farcaster API calls
```

**Reason:** Both were calling Farcaster/Neynar APIs. The `api.farcaster.xyz` endpoint was changed to use `api.neynar.com` for consistency.

**Files Updated:**
- `src/app/api/auth/me/route.ts` - Now uses `NEYNAR_API_KEY` and Neynar API endpoint
- `.env.example` - Removed `FARCASTER_API_KEY`

---

### 3. Consolidated Token Address Variables ✅
**Before:**
```
NEXT_PUBLIC_SECOND_TOKEN_ADDRESS=0xce9199a0c05446ceed4f0f928c864b7a2f9f86b3
REWARD_TOKEN_ADDRESS=0xce9199a0c05446ceed4f0f928c864b7a2f9f86b3
```

**After:**
```
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0xce9199a0c05446ceed4f0f928c864b7a2f9f86b3
```

**Files Updated:**
- `src/app/api/rounds/sign-claim/route.ts` - Now uses `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS`
- `src/app/api/checkin/sign-claim/route.ts` - Now uses `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS`
- `.env.example` - Consolidated to single variable

---

## Final Environment Variables List

### Required Variables
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | App URL (auth domain derived from this) |
| `NEYNAR_API_KEY` | Neynar/Farcaster API authentication |
| `NEXT_PUBLIC_NEYNAR_CLIENT_ID` | Neynar client ID for frontend |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_CHAIN_ID` | Blockchain chain ID (8453 for Base) |
| `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS` | Reward token contract address |
| `REWARD_CLAIMER_ADDRESS` | Reward claimer contract address |
| `REWARD_SIGNER_PRIVATE_KEY` | Private key for signing rewards |
| `CRON_SECRET` | Secret for cron job authentication |

### Optional Variables
| Variable | Purpose |
|----------|---------|
| `MEMPOOL_API_BASE` | Mempool API base URL |
| `BASE_RPC_URL` | Custom RPC URL |
| `NEXT_PUBLIC_ADMIN_FIDS` | Admin FID list |
| `NEXT_PUBLIC_ADMIN_WALLETS` | Admin wallet list |
| `NEXT_PUBLIC_FRAME_IMAGE_URL` | Farcaster frame image |
| `NEXT_PUBLIC_SPLASH_IMAGE_URL` | Farcaster splash image |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | Default currency display |
| `REWARD_TOKEN_CHECKIN_ADDRESS` | Separate check-in token (if different) |
| `REWARD_CLAIMER_CHECKIN_ADDRESS` | Separate check-in contract (if different) |

### Deprecated (No Longer Needed)
| Variable | Replacement |
|----------|-------------|
| `AUTH_DOMAIN` | Derived from `NEXT_PUBLIC_APP_URL` |
| `FARCASTER_API_KEY` | Use `NEYNAR_API_KEY` |
| `REWARD_TOKEN_ADDRESS` | Use `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS` |
| `NEXT_PUBLIC_SECOND_TOKEN_ADDRESS` | Use `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS` |

---

## Migration Steps for Existing Deployments

1. **Update Vercel Environment Variables:**
   - Remove: `AUTH_DOMAIN`, `FARCASTER_API_KEY`, `REWARD_TOKEN_ADDRESS`, `NEXT_PUBLIC_SECOND_TOKEN_ADDRESS`
   - Add: `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS` (copy value from old `REWARD_TOKEN_ADDRESS`)
   - Ensure `NEYNAR_API_KEY` is set

2. **Update Local `.env.local`:**
   ```bash
   # Remove these lines:
   AUTH_DOMAIN=...
   FARCASTER_API_KEY=...
   REWARD_TOKEN_ADDRESS=...
   NEXT_PUBLIC_SECOND_TOKEN_ADDRESS=...
   
   # Add this line:
   NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0xce9199a0c05446ceed4f0f928c864b7a2f9f86b3
   ```

3. **Deploy and Test:**
   - Test authentication flow
   - Test reward claiming
   - Verify admin access works

---

## Status: ✅ COMPLETED

All code changes have been applied and verified:
- No TypeScript errors in modified files
- Documentation updated (`AUDIT_REPORT.md`, `SECURITY.md`, `AUDIT_ACTION_ITEMS.md`)
- `.env.example` updated with consolidated variables

---

## Code Consolidation (Additional)

### Shared Utilities Created

1. **`src/lib/reward-signer.ts`** - EIP-712 signing logic
   - `signRewardClaim()` - Sign reward claims
   - `generateNonce()` - Generate unique nonce
   - `generateExpiry()` - Generate expiry timestamp

2. **`src/lib/supabase-server.ts`** - Server-side Supabase utilities
   - `createServerSupabase()` - Create typed Supabase client
   - `getRewardSignerConfig()` - Get reward signer env vars
   - `getCheckinSignerConfig()` - Get check-in signer env vars

3. **`src/lib/admin-constants.ts`** - Admin configuration (NEW)
   - `ADMIN_FIDS` - Admin FID list
   - `ADMIN_WALLETS` - Admin wallet list
   - `isAdminFid()` - Check if FID is admin
   - `isAdminWallet()` - Check if wallet is admin
   - `isAdminUser()` - Check if user identifier is admin

### Files Refactored
- `src/app/api/rounds/sign-claim/route.ts` - Uses shared utilities
- `src/app/api/checkin/sign-claim/route.ts` - Uses shared utilities
- `src/app/api/cron/check-rounds/route.ts` - Uses shared Supabase client, env-based mempool URL
- `src/lib/admin-auth.ts` - Now re-exports from admin-constants.ts
- `src/context/AuthContext.tsx` - Now imports from admin-constants.ts
- `src/context/GameContext.tsx` - Now imports from admin-constants.ts

### Duplicates Removed
- Admin functions (`isAdminFid`, `isAdminWallet`, `ADMIN_FIDS`, `ADMIN_WALLETS`) were duplicated in:
  - `src/lib/admin-auth.ts`
  - `src/context/AuthContext.tsx`
  - Now consolidated in `src/lib/admin-constants.ts`

### Benefits
- Reduced code duplication (~150 lines removed)
- Single source of truth for admin configuration
- Centralized configuration management
- Easier maintenance and testing
- Type-safe Supabase client
