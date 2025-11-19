# 🚀 Bitcoin Blocks - Maincloud Configuration

## ⚡ Quick Update: Using Maincloud Only

**Bitcoin Blocks sekarang dikonfigurasi untuk menggunakan SpacetimeDB Maincloud** untuk development dan production. Testnet tidak lagi didukung.

---

## 🎯 Why Maincloud?

### **Production-Ready dari Awal**
- ✅ Data persistent dan production-grade
- ✅ Better performance dan uptime SLA
- ✅ Automatic backups
- ✅ Monitoring dan analytics built-in
- ✅ Support team access

### **Simplified Workflow**
- ✅ Single environment (no testnet → maincloud migration)
- ✅ Consistent data across development dan production
- ✅ Easier debugging dan testing

---

## 💰 Cost Transparency

| Plan | Price | Specs | Best For |
|------|-------|-------|----------|
| **Starter** | **$49/month** | 1 GB storage, 10k req/sec | Bitcoin Blocks perfect fit |
| **Pro** | $199/month | 10 GB storage, 50k req/sec | High-traffic apps |
| **Enterprise** | Custom | Unlimited | Large-scale production |

**For Bitcoin Blocks**: Starter plan adalah pilihan terbaik.

**Estimated Usage**:
- Storage: ~200-500 MB
- Requests: ~50-200 req/sec average
- Users: 500-2,000 daily active users

---

## 📋 Configuration Updates

### **Environment Variables**

Semua environment files sekarang menggunakan maincloud:

#### **.env.local** (Development)
```bash
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks
```

#### **.env.production** (Production - Vercel)
```bash
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks
```

#### **.env.example** (Template)
```bash
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks
```

---

## 🔄 Deployment Commands

### **Publish to Maincloud**

```bash
cd spacetime-server
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com
```

### **Update Schema**

```bash
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com
```

⚠️ **NEVER use** `--clear-database` di maincloud! Data akan hilang permanent.

### **View Logs**

```bash
spacetime logs bitcoin-blocks --host mainnet.spacetimedb.com --follow
```

### **Database Info**

```bash
spacetime describe bitcoin-blocks --host mainnet.spacetimedb.com
```

---

## 🏗️ Migration dari Testnet

Jika Anda sebelumnya menggunakan testnet:

### **Step 1: Update Environment Variables**

Update all `.env` files:

```bash
# OLD (testnet)
NEXT_PUBLIC_SPACETIME_HOST=wss://testnet.spacetimedb.com

# NEW (maincloud)
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
```

### **Step 2: Publish to Maincloud**

```bash
cd spacetime-server
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com --clear-database
```

Note: `--clear-database` OK untuk first-time publish ke maincloud.

### **Step 3: Update Vercel**

1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Update `NEXT_PUBLIC_SPACETIME_HOST` ke `wss://mainnet.spacetimedb.com`
4. Redeploy: `git push origin main`

### **Step 4: Verify**

Test app untuk ensure:
- ✅ Connection ke maincloud successful
- ✅ Tables created correctly
- ✅ Reducers working
- ✅ Real-time updates functioning

---

## 🛠️ Code Changes

### **src/lib/spacetime-client.ts**

Default host updated to maincloud:

```typescript
// OLD
const SPACETIME_HOST = process.env.NEXT_PUBLIC_SPACETIME_HOST || 'wss://testnet.spacetimedb.com'

// NEW
const SPACETIME_HOST = process.env.NEXT_PUBLIC_SPACETIME_HOST || 'wss://mainnet.spacetimedb.com'
```

### **Error Messages**

Error messages updated to reference maincloud:

```typescript
console.error('2. Publish to maincloud: cd spacetime-server && spacetime publish --host mainnet.spacetimedb.com bitcoin-blocks')
```

---

## ✅ Verification Checklist

Setelah switch ke maincloud, verify:

- [ ] `.env.local` uses `wss://mainnet.spacetimedb.com`
- [ ] `.env.production` uses `wss://mainnet.spacetimedb.com`
- [ ] Module published to maincloud successfully
- [ ] Local development connects to maincloud
- [ ] Vercel environment variables updated
- [ ] Production deployment successful
- [ ] All features working (auth, game, chat, check-in)
- [ ] Real-time updates functioning across all clients

---

## 🐛 Troubleshooting

### **Error: Connection Refused**

```
Solution:
1. Verify host: wss://mainnet.spacetimedb.com
2. Check module published: spacetime list --host mainnet.spacetimedb.com
3. Ensure SpacetimeDB account has active subscription
```

### **Error: Module Not Found**

```
Solution:
1. Publish module: spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com
2. Verify DB name matches: NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks
```

### **Error: Authentication Failed**

```
Solution:
1. Login to maincloud: spacetime login
2. Select correct account/organization
3. Verify billing/subscription active
```

---

## 📊 Monitoring & Management

### **Dashboard Access**

Access maincloud dashboard:
```
https://spacetimedb.com/dashboard
```

Features:
- 📊 Real-time metrics
- 📈 Usage analytics
- 🚨 Alerts configuration
- 💾 Backup management
- 🔐 Access control

### **CLI Monitoring**

```bash
# Logs (real-time)
spacetime logs bitcoin-blocks --host mainnet.spacetimedb.com --follow

# Metrics
spacetime metrics bitcoin-blocks --host mainnet.spacetimedb.com

# Database info
spacetime describe bitcoin-blocks --host mainnet.spacetimedb.com

# Query data
spacetime sql bitcoin-blocks "SELECT COUNT(*) FROM rounds" --host mainnet.spacetimedb.com
```

---

## 💡 Best Practices

### **1. Never Clear Database in Production**

```bash
# ❌ DANGEROUS - will delete all data!
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com --clear-database

# ✅ SAFE - updates schema without data loss
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com
```

### **2. Test Schema Changes Carefully**

Before publishing breaking changes:
1. Test locally first
2. Write migration logic if needed
3. Announce maintenance window
4. Backup data (if possible)
5. Then publish update

### **3. Monitor After Deployment**

After every publish:
```bash
# Watch logs for errors
spacetime logs bitcoin-blocks --host mainnet.spacetimedb.com --follow

# Check metrics
spacetime metrics bitcoin-blocks --host mainnet.spacetimedb.com
```

### **4. Set Up Alerts**

Configure alerts di dashboard untuk:
- High error rates
- Connection failures
- Storage nearing limit
- Unusual traffic spikes

---

## 📚 Updated Documentation

Semua tutorial telah diupdate untuk maincloud:

- ✅ [01-SETUP-NEYNAR.md](./01-SETUP-NEYNAR.md) - Unchanged
- ✅ [02-SETUP-WALLETCONNECT.md](./02-SETUP-WALLETCONNECT.md) - Unchanged
- ✅ [03-DEPLOY-SPACETIMEDB.md](./03-DEPLOY-SPACETIMEDB.md) - **Updated untuk maincloud**
- ✅ [04-DEPLOY-VERCEL.md](./04-DEPLOY-VERCEL.md) - **Updated dengan maincloud env vars**
- ✅ [05-COMPLETE-INTEGRATION.md](./05-COMPLETE-INTEGRATION.md) - **Updated testing procedures**
- ✅ [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - **All commands use maincloud**

---

## 🎯 Summary

**Bitcoin Blocks is now configured for Maincloud-only deployment:**

- ✅ Production-ready from day 1
- ✅ Consistent environment across dev & prod
- ✅ Better performance and reliability
- ✅ Professional-grade monitoring
- ✅ $49/month for complete backend

**No more testnet, no more migration worries. Just build and deploy!** 🚀

---

**Next Steps:**
1. [Setup Neynar](./01-SETUP-NEYNAR.md)
2. [Setup WalletConnect](./02-SETUP-WALLETCONNECT.md)
3. [Deploy to Maincloud](./03-DEPLOY-SPACETIMEDB.md)
4. [Deploy to Vercel](./04-DEPLOY-VERCEL.md)
5. [Complete Integration](./05-COMPLETE-INTEGRATION.md)
