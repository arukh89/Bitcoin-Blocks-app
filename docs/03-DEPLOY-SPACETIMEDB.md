# 🗄️ Tutorial Deploy SpacetimeDB Maincloud

## Apa itu SpacetimeDB?

SpacetimeDB adalah database yang menggabungkan:
- ✅ **Storage** - Menyimpan data seperti PostgreSQL/MySQL
- ✅ **Compute** - Menjalankan logic di database (Rust reducers)
- ✅ **Real-time Sync** - WebSocket subscriptions otomatis

Untuk Bitcoin Blocks, SpacetimeDB meng-handle:
- Game rounds
- User guesses/predictions
- Check-in system
- Chat messages
- Leaderboards

---

## 📋 Step-by-Step Deploy SpacetimeDB

### **Step 1: Install SpacetimeDB CLI**

#### **MacOS / Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://install.spacetimedb.com | sh
```

#### **Windows (PowerShell):**
```powershell
iwr https://install.spacetimedb.com/windows.ps1 -useb | iex
```

#### **Verify Installation:**
```bash
spacetime --version
```

Expected output:
```
spacetime 0.10.0
```

---

### **Step 2: Create SpacetimeDB Account**

#### **2.1 - Generate Identity**

Buat identity lokal (seperti SSH key):

```bash
spacetime identity init
```

Output:
```
Created new identity: YOUR_IDENTITY_NAME
Public key: 0x1234567890abcdef...
```

#### **2.2 - Set Identity Name**

```bash
spacetime identity set-name my-bitcoin-blocks-identity
```

#### **2.3 - List Identities**

```bash
spacetime identity list
```

Output:
```
* my-bitcoin-blocks-identity (default)
  Public key: 0x1234567890abcdef...
```

---

### **Step 3: Pilih SpacetimeDB Host**

Ada 2 options untuk deployment:

#### **Option A: Testnet (Development - FREE)**
```bash
Host: testnet.spacetimedb.com
Purpose: Development, testing, staging
Data: Bisa di-reset kapan saja
Cost: FREE
```

#### **Option B: Maincloud (Production - PAID)**
```bash
Host: mainnet.spacetimedb.com
Purpose: Production apps with real users
Data: Persistent dan production-ready
Cost: Mulai dari $49/month
```

**Untuk tutorial ini, kita mulai dengan Testnet dulu.**

---

### **Step 4: Set Host (Testnet)**

```bash
# Set default host to testnet
spacetime server set https://testnet.spacetimedb.com
```

Verify:
```bash
spacetime server list
```

Output:
```
* https://testnet.spacetimedb.com (default)
```

---

### **Step 5: Publish Module ke Testnet**

Navigate ke folder backend:

```bash
cd spacetime-server
```

Publish module:

```bash
spacetime publish bitcoin-blocks --clear-database
```

Flags:
- `bitcoin-blocks` = database name
- `--clear-database` = reset existing data (hati-hati!)

Output:
```
Building module...
✓ Module built successfully
Publishing to testnet.spacetimedb.com...
✓ Published successfully

Database: bitcoin-blocks
Address: https://testnet.spacetimedb.com/database/bitcoin-blocks
Host: wss://testnet.spacetimedb.com

Tables created:
  - rounds
  - guesses
  - chat_messages
  - logs
  - prize_config
  - user_check_ins
  - check_in_streak

Reducers available:
  - createRound
  - submitGuess
  - updateRoundResult
  - sendChatMessage
  - performCheckIn
  - savePrizeConfig
  - endRoundManually
```

---

### **Step 6: Verify Deployment**

#### **6.1 - Check Database Info**

```bash
spacetime describe bitcoin-blocks
```

Output:
```
Database: bitcoin-blocks
Owner: my-bitcoin-blocks-identity
Host: testnet.spacetimedb.com

Tables: 7
Reducers: 7
Indexes: 4

Status: ✓ Running
```

#### **6.2 - View Logs**

```bash
spacetime logs bitcoin-blocks
```

Logs akan stream real-time:
```
[INFO] Database initialized
[INFO] Listening for connections...
[INFO] Client connected: 192.168.1.100
```

#### **6.3 - List Tables**

```bash
spacetime sql bitcoin-blocks "SELECT * FROM rounds LIMIT 5"
```

---

### **Step 7: Update Frontend Environment**

Setelah publish, update environment variables:

#### **.env.local**
```bash
# Testnet
NEXT_PUBLIC_SPACETIME_HOST=wss://testnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks
```

Restart development server:
```bash
pnpm dev
```

---

## 🚀 Deploy ke Maincloud (Production)

### **Step 8: Switch to Maincloud**

#### **8.1 - Set Maincloud as Host**

```bash
spacetime server add https://mainnet.spacetimedb.com maincloud
spacetime server set maincloud
```

#### **8.2 - Create Account (if needed)**

Maincloud requires authentication:

```bash
spacetime login
```

Ini akan open browser untuk login/register di SpacetimeDB website.

#### **8.3 - Select Plan**

Pilih plan yang sesuai:

| Plan | Price | Specs |
|------|-------|-------|
| **Starter** | $49/mo | 1 GB storage, 10k req/sec |
| **Pro** | $199/mo | 10 GB storage, 50k req/sec |
| **Enterprise** | Custom | Unlimited, SLA, support |

Untuk Bitcoin Blocks dengan moderate traffic, **Starter plan sudah cukup**.

---

### **Step 9: Publish ke Maincloud**

```bash
cd spacetime-server
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com
```

**⚠️ IMPORTANT:** JANGAN gunakan `--clear-database` di production!

Output:
```
Building module...
✓ Module built successfully
Publishing to mainnet.spacetimedb.com...
✓ Published successfully

Database: bitcoin-blocks
Address: https://mainnet.spacetimedb.com/database/bitcoin-blocks
Host: wss://mainnet.spacetimedb.com

✓ Production deployment successful!
```

---

### **Step 10: Update Production Environment**

#### **Vercel Environment Variables:**

1. Go to Vercel Dashboard
2. Select **bitcoin-blocks** project
3. Settings → Environment Variables
4. Update/Add:

```bash
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks
```

5. Redeploy Vercel:
```bash
git push origin main
```

---

## 🔄 Update Module (setelah code changes)

### **When to Update:**

Update SpacetimeDB module ketika Anda ubah:
- Table schemas di `lib.rs`
- Reducers logic
- Indexes atau constraints

### **Update Steps:**

```bash
cd spacetime-server

# Testnet
spacetime publish bitcoin-blocks --host testnet.spacetimedb.com

# Maincloud (production)
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com
```

**⚠️ PENTING untuk Production:**
- Test di testnet dulu
- Backup data jika ada schema changes
- Update frontend code accordingly
- Announce maintenance window untuk users

---

## 🗂️ Database Management

### **View All Databases**

```bash
spacetime list
```

Output:
```
Databases:
  - bitcoin-blocks (running)
  - test-db (stopped)
```

### **Delete Database (BE CAREFUL!)**

```bash
# Testnet - OK to delete
spacetime delete bitcoin-blocks --host testnet.spacetimedb.com

# Production - THINK TWICE!
spacetime delete bitcoin-blocks --host mainnet.spacetimedb.com
```

### **Reset Data (Keep Schema)**

```bash
spacetime publish bitcoin-blocks --clear-database
```

⚠️ Ini akan **HAPUS SEMUA DATA** tapi keep table schemas!

### **Backup Database**

SpacetimeDB maincloud include automatic backups. Manual backup:

```bash
# Export all tables to JSON
spacetime sql bitcoin-blocks "SELECT * FROM rounds" > backup_rounds.json
spacetime sql bitcoin-blocks "SELECT * FROM guesses" > backup_guesses.json
# ... repeat untuk tables lain
```

---

## 📊 Monitoring & Analytics

### **View Real-time Logs**

```bash
spacetime logs bitcoin-blocks --follow
```

### **Check Database Metrics**

```bash
spacetime metrics bitcoin-blocks
```

Output:
```
Connections: 42 active
Requests/sec: 150
Storage used: 234 MB / 1 GB
Uptime: 7 days, 3 hours
```

### **SQL Queries untuk Analytics**

```bash
# Count total guesses
spacetime sql bitcoin-blocks "SELECT COUNT(*) FROM guesses"

# Top players by guesses
spacetime sql bitcoin-blocks "
  SELECT username, COUNT(*) as guess_count 
  FROM guesses 
  GROUP BY username 
  ORDER BY guess_count DESC 
  LIMIT 10
"

# Active rounds
spacetime sql bitcoin-blocks "
  SELECT * FROM rounds 
  WHERE status = 'open'
"
```

---

## 🔒 Security Best Practices

### **1. Identity Management**

```bash
# Backup your identity
cp ~/.spacetime/identity.toml ~/identity_backup.toml

# Secure backup location
chmod 600 ~/identity_backup.toml
```

### **2. Access Control**

SpacetimeDB uses identity-based auth:
- Only identity owner can publish/update
- Public read access via WebSocket
- Reducers enforce business logic

### **3. Reducer Validation**

Always validate inputs di reducers:

```rust
#[spacetimedb::reducer]
pub fn submit_guess(ctx: &ReduceContext, guess: u64) -> Result<(), String> {
    // Validate range
    if guess == 0 || guess > 1_000_000 {
        return Err("Invalid guess range".to_string());
    }
    
    // Validate round exists and is open
    let round = ctx.db.rounds()
        .filter(|r| r.status == "open")
        .next()
        .ok_or("No active round")?;
    
    // Continue with logic...
    Ok(())
}
```

---

## 🐛 Troubleshooting

### **Error: Identity not found**
```
Solution:
1. Run: spacetime identity init
2. Set default: spacetime identity set-name my-identity
3. Try publish again
```

### **Error: Database already exists**
```
Solution:
1. Delete existing: spacetime delete bitcoin-blocks
2. Or use different name: spacetime publish bitcoin-blocks-v2
```

### **Error: Module failed to build**
```
Solution:
1. Check Rust syntax in lib.rs
2. Run: cargo check in spacetime-server/
3. Fix compilation errors
4. Try publish again
```

### **Error: Connection refused**
```
Solution:
1. Check host: spacetime server list
2. Verify internet connection
3. Check SpacetimeDB status
4. Try: spacetime server set https://testnet.spacetimedb.com
```

### **Schema Changes Breaking**

Jika update schema menyebabkan incompatibility:

```bash
# Option 1: Clear database (lose data)
spacetime publish bitcoin-blocks --clear-database

# Option 2: Write migration reducer
# Add reducer to migrate old data to new schema
# Then publish without --clear-database
```

---

## 💰 Cost Estimation

### **Testnet (FREE)**
- Unlimited selama development
- Data bisa di-reset
- Rate limiting: 1000 req/sec

### **Maincloud Pricing**

For **Bitcoin Blocks** with estimated:
- 1,000 daily active users
- 50 req/sec average
- 5 GB data storage

**Recommended Plan:** Starter ($49/month)

Breakdown:
```
Storage: 234 MB (well under 1 GB limit)
Requests: ~50/sec peak (well under 10k/sec limit)
Connections: ~100 concurrent (included)

Total: $49/month
```

If scaling beyond:
- Upgrade to Pro ($199/mo) for 10 GB + 50k req/sec
- Enterprise for unlimited

---

## 📈 Performance Optimization

### **1. Indexes**

Already implemented di `lib.rs`:

```rust
#[spacetimedb::table(name = rounds, index(name = idx_status, btree(columns = [status])))]
```

Indexes speed up queries by status, round_id, etc.

### **2. Reducer Efficiency**

Keep reducers fast:
- Minimize database scans
- Use indexes for lookups
- Batch operations when possible

### **3. Client-side Caching**

Frontend already implements caching:
- Subscribe once, receive updates
- Local state management in GameContext
- Optimistic UI updates

---

## 🧪 Testing Guide

### **Test Reducers Locally**

Before publishing, test reducers:

```bash
cd spacetime-server
cargo test
```

### **Test on Testnet First**

Always test on testnet before maincloud:

```bash
# 1. Publish to testnet
spacetime publish bitcoin-blocks --host testnet.spacetimedb.com

# 2. Update frontend .env.local to testnet
# 3. Test all features
# 4. If OK, publish to maincloud
```

### **Integration Testing**

Test checklist:
- [ ] Create round (admin)
- [ ] Submit guess (user)
- [ ] Chat messages
- [ ] Check-in system
- [ ] Update round result
- [ ] View leaderboards

---

## 📚 Resources

- **SpacetimeDB Docs:** https://docs.spacetimedb.com
- **Rust SDK Reference:** https://docs.spacetimedb.com/rust
- **CLI Reference:** https://docs.spacetimedb.com/cli
- **Discord Support:** https://discord.gg/spacetimedb
- **GitHub:** https://github.com/clockworklabs/SpacetimeDB
- **Status Page:** https://status.spacetimedb.com

---

## ✅ Checklist Deploy SpacetimeDB

### **Testnet (Development):**
- [ ] Install SpacetimeDB CLI
- [ ] Create identity
- [ ] Set host to testnet
- [ ] Publish module
- [ ] Verify tables created
- [ ] Test reducers
- [ ] Update frontend .env.local
- [ ] Test integration

### **Maincloud (Production):**
- [ ] Create SpacetimeDB account
- [ ] Select pricing plan
- [ ] Switch to maincloud host
- [ ] Login via CLI
- [ ] Publish module (without --clear-database!)
- [ ] Update Vercel environment variables
- [ ] Deploy frontend
- [ ] Monitor logs and metrics
- [ ] Setup alerting

---

**Next:** [04-DEPLOY-VERCEL.md](./04-DEPLOY-VERCEL.md) - Deploy frontend ke Vercel
