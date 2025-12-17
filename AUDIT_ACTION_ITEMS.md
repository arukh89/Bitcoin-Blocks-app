# Audit Action Items - Prioritized Checklist

## 🔴 CRITICAL - Do Today

### 1. Rotate Exposed Private Key
```bash
# 1. Generate new wallet (use secure method)
# 2. Update RewardClaimer contract signer
cast send 0x80Fd04c6C4D43C2434512CdAe05E30c46f3a330D "setSigner(address)" <NEW_SIGNER_ADDRESS> --account deployer --rpc-url https://mainnet.base.org

# 3. Update Vercel environment variable (NOT in code)
# Go to: Vercel Dashboard > Project > Settings > Environment Variables
# Update: REWARD_SIGNER_PRIVATE_KEY
```

### 2. Rotate API Keys
- [ ] Neynar API Key - https://neynar.com/dashboard (used for all Farcaster API calls)
- [ ] Consider rotating Supabase anon key if RLS not properly configured

### 3. Remove Exposed Files from Repository
```bash
# Remove files from git tracking
git rm --cached .env.local
git rm --cached .env.vercel

# Verify .gitignore has these entries
echo ".env.local" >> .gitignore
echo ".env.vercel" >> .gitignore
echo ".env.*.local" >> .gitignore

# Commit the removal
git add .gitignore
git commit -m "security: remove exposed credentials from repository"
git push
```

### 4. Audit Blockchain for Unauthorized Claims
```bash
# Check recent claims on the RewardClaimer contract
cast logs --address 0x80Fd04c6C4D43C2434512CdAe05E30c46f3a330D --rpc-url https://mainnet.base.org
```

---

## 🟠 HIGH - Do This Week

### 5. Fix Cron Authorization
**File:** `src/app/api/cron/check-rounds/route.ts`

```typescript
// Change from:
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {

// To:
if (!cronSecret) {
  console.error('CRON_SECRET not configured')
  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
}
if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 6. Add Server-Side Admin Verification
Create middleware for admin routes:

```typescript
// src/lib/admin-auth.ts
export async function verifyAdmin(request: Request): Promise<boolean> {
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) return false
  
  // Verify JWT and check FID against ADMIN_FIDS
  // ... implementation
}
```

### 7. Add Database Constraints
```sql
-- Add unique constraint to prevent duplicate guesses
ALTER TABLE guesses ADD CONSTRAINT unique_guess_per_round 
  UNIQUE (round_id, fid);

-- Add unique constraint to prevent duplicate check-ins
ALTER TABLE checkins ADD CONSTRAINT unique_checkin_per_day 
  UNIQUE (user_identifier, DATE(checkin_date));
```

### 8. Remove DEV_NO_DB Bypass ✅ DONE
**Files:** `src/app/api/rounds/sign-claim/route.ts`, `src/app/api/checkin/sign-claim/route.ts`

**Status:** DEV_NO_DB bypass has been removed. All claim requests now require database validation.

---

## 🟡 MEDIUM - Do This Sprint

### 9. Update .env.example
Add missing variables (if needed):
```bash
# Add to .env.example:
NEYNAR_CLIENT_SECRET=FILL_ME
REWARD_CLAIMER_CHECKIN_ADDRESS=FILL_ME
REWARD_TOKEN_CHECKIN_ADDRESS=FILL_ME
```

Note: `FARCASTER_API_KEY` has been consolidated into `NEYNAR_API_KEY`.

### 10. Add Rate Limiting
Install and configure:
```bash
pnpm add @upstash/ratelimit @upstash/redis
```

### 11. Add Error Boundaries ✅ DONE
**Status:** `src/components/ErrorBoundary.tsx` already exists with full implementation including fallback UI, development error details, and `withErrorBoundary` HOC.

### 12. Move temp_geo to Separate Repository
```bash
# Create new repo for temp_geo
cd temp_geo
git init
git remote add origin <new-repo-url>
git add .
git commit -m "Initial commit - GeoGuesser game"
git push -u origin main

# Remove from main repo
cd ..
rm -rf temp_geo
git add -A
git commit -m "chore: move temp_geo to separate repository"
```

---

## 🟢 LOW - Do Next Sprint

### 13. Add Test Coverage
```bash
# Install testing dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Create vitest.config.ts
# Write tests for:
# - AuthContext
# - GameContext
# - API routes
# - Critical components
```

### 14. Add Security Headers
Update `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

### 15. Add Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Set up Vercel Analytics
- [ ] Configure cron job alerting

### 16. Refactor Large Components
- [ ] Split `AdminPanel.tsx` into smaller components
- [ ] Extract custom hooks from `GameContext.tsx`

---

## Verification Checklist

After completing fixes, verify:

- [ ] Old private key no longer works for signing
- [ ] New signatures are accepted by contract
- [ ] .env files not visible in GitHub
- [ ] Cron endpoint returns 401 without secret
- [ ] Duplicate guesses are rejected
- [ ] Duplicate check-ins are rejected
- [ ] Admin panel only accessible to admins
- [ ] All tests pass
- [ ] No console errors in production

---

*Generated from AUDIT_REPORT.md*
