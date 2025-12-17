# Security Guidelines

## 🔴 CRITICAL: Credential Management

### Never Commit Secrets
The following files should NEVER be committed to git:
- `.env.local`
- `.env.vercel`
- `.env.production`
- Any file containing private keys or API secrets

### Required Environment Variables
All secrets should be set via your deployment platform (Vercel, etc.):

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `REWARD_SIGNER_PRIVATE_KEY` | Private key for signing rewards | Vercel Dashboard |
| `CRON_SECRET` | Secret for cron job authentication | Vercel Dashboard |
| `NEYNAR_API_KEY` | Neynar API key (for all Farcaster API calls) | Vercel Dashboard |
| `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS` | Reward token contract address | Vercel Dashboard |

### Rotating Compromised Keys

If any key is exposed:

1. **REWARD_SIGNER_PRIVATE_KEY**:
   ```bash
   # Generate new wallet
   cast wallet new
   
   # Update signer in contract
   cast send $REWARD_CLAIMER_ADDRESS "setSigner(address)" $NEW_SIGNER_ADDRESS --account deployer
   
   # Update in Vercel dashboard
   ```

2. **API Keys**:
   - Regenerate in Neynar dashboard (https://neynar.com)
   - Update `NEYNAR_API_KEY` in Vercel environment variables
   - Monitor for unauthorized usage

## 🟠 Authorization

### Admin Access
Admin status is determined by:
- `NEXT_PUBLIC_ADMIN_FIDS` - Farcaster IDs with admin access
- `NEXT_PUBLIC_ADMIN_WALLETS` - Wallet addresses with admin access

**Important**: Always verify admin status server-side for sensitive operations.

### API Security
- All cron endpoints require `CRON_SECRET` authentication
- Reward claim endpoints validate eligibility server-side
- Database constraints prevent duplicate claims

## 🟡 Database Security

### Row Level Security (RLS)
Ensure RLS is enabled on all Supabase tables. Run the migration:
```sql
-- See supabase/migrations/001_add_constraints.sql
```

### Unique Constraints
The following constraints prevent race conditions:
- `guesses_round_fid_unique` - One guess per user per round
- `checkins_user_date_unique` - One check-in per user per day
- `reward_claims_unique` - One claim per type per user per round

## 🟢 Best Practices

1. **Use environment variables** for all secrets
2. **Rotate keys regularly** (every 90 days recommended)
3. **Monitor logs** for unauthorized access attempts
4. **Keep dependencies updated** for security patches
5. **Use HTTPS only** in production

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT create a public GitHub issue
2. Email the maintainers directly
3. Allow 48 hours for initial response
