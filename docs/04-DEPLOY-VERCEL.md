# ▲ Tutorial Deploy ke Vercel

## Apa itu Vercel?

Vercel adalah platform untuk deploy Next.js apps dengan:
- ✅ **Auto-deployment** dari Git
- ✅ **Serverless Functions** untuk API routes
- ✅ **Global CDN** untuk fast loading
- ✅ **Preview Deployments** untuk setiap PR
- ✅ **Custom Domains** support

Bitcoin Blocks frontend akan di-deploy di Vercel.

---

## 📋 Step-by-Step Deploy ke Vercel

### **Step 1: Persiapan Repository**

#### **1.1 - Initialize Git (jika belum)**

```bash
# Cek apakah sudah git repo
git status

# Jika belum, initialize
git init
git add .
git commit -m "Initial commit - Bitcoin Blocks"
```

#### **1.2 - Create GitHub Repository**

1. Go to: **https://github.com/new**

2. Isi form:
   ```
   Repository name: bitcoin-blocks
   Description: Bitcoin prediction game on Farcaster
   Visibility: Public (atau Private)
   ```

3. **JANGAN** initialize dengan README, .gitignore, atau license

4. Click **"Create repository"**

#### **1.3 - Push ke GitHub**

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/bitcoin-blocks.git

# Push
git branch -M main
git push -u origin main
```

Verify di GitHub bahwa code sudah uploaded.

---

### **Step 2: Create Vercel Account**

1. Go to: **https://vercel.com/signup**

2. Sign up dengan:
   - ✅ **GitHub** (Recommended - untuk auto-import repos)
   - GitLab
   - Bitbucket
   - Email

3. Authorize Vercel untuk access GitHub repositories

4. Setelah login, Anda masuk ke **Vercel Dashboard**

---

### **Step 3: Import Project ke Vercel**

#### **3.1 - Add New Project**

1. Di Vercel Dashboard, click **"Add New..."** → **"Project"**

2. Vercel akan list semua GitHub repos

3. Find **bitcoin-blocks** dan click **"Import"**

#### **3.2 - Configure Project**

Vercel auto-detect Next.js, tapi verify settings:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: pnpm build (auto-detected)
Output Directory: .next (auto-detected)
Install Command: pnpm install (auto-detected)
Node.js Version: 20.x (recommended)
```

#### **3.3 - Environment Variables**

**CRITICAL:** Add environment variables SEBELUM deploy!

Click **"Environment Variables"** dan add:

```bash
# SpacetimeDB (use testnet first)
NEXT_PUBLIC_SPACETIME_HOST=wss://testnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks

# Neynar (dari tutorial 01)
NEXT_PUBLIC_NEYNAR_CLIENT_ID=your_neynar_client_id
NEYNAR_API_KEY=your_neynar_api_key

# WalletConnect (dari tutorial 02)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# App URL (update setelah deploy pertama)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Apply to:** Check semua:
- ✅ Production
- ✅ Preview
- ✅ Development

#### **3.4 - Deploy**

1. Click **"Deploy"**

2. Vercel akan:
   - Clone repo
   - Install dependencies (`pnpm install`)
   - Build app (`pnpm build`)
   - Deploy ke global CDN

3. Wait 2-3 minutes untuk deployment

4. Success screen akan show:
   ```
   🎉 Your project is live!
   https://bitcoin-blocks.vercel.app
   ```

---

### **Step 4: Update App URL**

Setelah deploy pertama, update environment variable:

1. Copy production URL: `https://bitcoin-blocks-xxxx.vercel.app`

2. Di Vercel Dashboard → Project → Settings → Environment Variables

3. Edit **NEXT_PUBLIC_APP_URL**:
   ```
   NEXT_PUBLIC_APP_URL=https://bitcoin-blocks-xxxx.vercel.app
   ```

4. Click **"Save"**

5. **Redeploy:**
   - Deployments tab → Latest deployment → Three dots → "Redeploy"
   - Or: `git commit --allow-empty -m "Trigger redeploy" && git push`

---

### **Step 5: Setup Custom Domain (Optional)**

#### **5.1 - Add Domain**

1. Vercel Dashboard → Project → Settings → **Domains**

2. Click **"Add"**

3. Enter domain:
   ```
   bitcoinblocks.com
   ```

4. Click **"Add"**

#### **5.2 - Configure DNS**

Vercel akan show DNS records yang harus di-add:

**If using Cloudflare, Namecheap, GoDaddy, etc:**

Add these records:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### **5.3 - Verify Domain**

1. Wait 5-10 minutes untuk DNS propagation

2. Vercel auto-verify dan issue SSL certificate

3. Your app akan available di:
   - https://bitcoinblocks.com
   - https://www.bitcoinblocks.com
   - https://bitcoin-blocks.vercel.app (tetap active)

#### **5.4 - Update Environment Variables**

Update dengan custom domain:

```bash
NEXT_PUBLIC_APP_URL=https://bitcoinblocks.com
```

Dan update di:
- Neynar OAuth redirect URIs
- WalletConnect allowed domains
- Farcaster manifest

Redeploy untuk apply changes.

---

## 🔄 Auto-Deployment Workflow

### **How it Works:**

```
┌──────────────────────────────────────────────────────┐
│  1. Developer push code ke GitHub                    │
│     git push origin main                             │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  2. GitHub webhook trigger Vercel                    │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  3. Vercel clone repo                                │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  4. Install dependencies: pnpm install               │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  5. Build: pnpm build                                │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  6. Deploy ke global CDN                             │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  7. Vercel send notification                         │
│     ✓ Deployment successful!                        │
└──────────────────────────────────────────────────────┘
```

### **Every Push = Auto Deploy!**

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel auto-deploy in 2-3 minutes
# No manual steps required!
```

---

## 🔀 Preview Deployments

### **Feature Branch Deployments:**

Setiap branch dan PR mendapat unique preview URL!

```bash
# Create feature branch
git checkout -b feature/new-leaderboard

# Make changes
git add .
git commit -m "Add new leaderboard design"
git push origin feature/new-leaderboard

# Vercel auto-deploy preview:
# https://bitcoin-blocks-git-feature-new-leaderboard.vercel.app
```

### **Pull Request Integration:**

1. Create PR di GitHub

2. Vercel comment di PR dengan preview link:
   ```
   ✅ Preview deployment ready!
   https://bitcoin-blocks-pr-42.vercel.app
   ```

3. Review changes di preview URL

4. Merge PR → auto-deploy ke production

---

## 📊 Monitor Deployments

### **Deployment Dashboard:**

Vercel Dashboard → Project → **Deployments**

View:
- ✅ Deployment status (Building, Ready, Error)
- ⏱️ Build time
- 📊 Build logs
- 🌍 Deployed regions
- 📈 Analytics

### **Real-time Logs:**

Click deployment → **View Function Logs**

See:
- API route executions
- Server-side errors
- Performance metrics
- Request volumes

### **Analytics:**

Vercel Dashboard → Project → **Analytics**

Track:
- Page views
- Unique visitors
- Top pages
- Devices (mobile/desktop)
- Countries
- Performance scores

---

## ⚙️ Advanced Configuration

### **Vercel.json Configuration**

Project sudah include `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### **Environment Variables per Environment:**

Set different values untuk different environments:

**Production:**
```bash
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
```

**Preview:**
```bash
NEXT_PUBLIC_SPACETIME_HOST=wss://testnet.spacetimedb.com
```

**Development:**
```bash
NEXT_PUBLIC_SPACETIME_HOST=wss://testnet.spacetimedb.com
```

---

## 🚀 Performance Optimization

### **1. Enable Vercel Speed Insights**

```bash
# Install
pnpm add @vercel/speed-insights

# Add to layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### **2. Enable Vercel Analytics**

```bash
# Install
pnpm add @vercel/analytics

# Add to layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### **3. Image Optimization**

Next.js Image component auto-optimized by Vercel:

```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Bitcoin Blocks"
  width={200}
  height={200}
  priority // untuk above-the-fold images
/>
```

---

## 🔒 Security Best Practices

### **1. Environment Variables**

- ✅ Use `NEXT_PUBLIC_*` untuk client-side vars
- ✅ Keep secrets server-side only (tanpa NEXT_PUBLIC_)
- ❌ NEVER commit .env files ke Git

### **2. API Routes Protection**

```typescript
// src/app/api/admin/route.ts
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Verify admin token
  const token = request.headers.get('authorization')
  
  if (!token || !verifyAdminToken(token)) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Admin logic...
}
```

### **3. CORS Headers**

Already configured di `vercel.json` untuk allow SpacetimeDB connections.

### **4. Rate Limiting**

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimit = new Map()

export function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown'
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100
  
  const requests = rateLimit.get(ip) || []
  const recentRequests = requests.filter((time: number) => now - time < windowMs)
  
  if (recentRequests.length >= maxRequests) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  recentRequests.push(now)
  rateLimit.set(ip, recentRequests)
  
  return NextResponse.next()
}
```

---

## 💰 Vercel Pricing

### **Hobby Plan (FREE)**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless Functions
- ✅ Custom domains
- ✅ SSL certificates
- ❌ No team collaboration
- ❌ No password protection

**Perfect untuk Bitcoin Blocks personal project!**

### **Pro Plan ($20/month)**
- ✅ Everything in Hobby
- ✅ Team collaboration
- ✅ Password-protected deployments
- ✅ Analytics
- ✅ 1 TB bandwidth/month
- ✅ Priority support

### **Enterprise (Custom)**
- ✅ Everything in Pro
- ✅ Dedicated infrastructure
- ✅ SLA guarantees
- ✅ 99.99% uptime
- ✅ Advanced security

---

## 🐛 Troubleshooting

### **Build Failed: "Command failed with exit code 1"**

**Check build logs:**

1. Vercel Dashboard → Deployments → Failed deployment
2. Click **"View Build Logs"**
3. Look for error messages

**Common causes:**
```
- TypeScript errors
- Missing environment variables
- Package installation errors
- Out of memory (increase in settings)
```

**Solution:**
```bash
# Test build locally
pnpm build

# Fix errors
# Push fix
git push origin main
```

### **Environment Variables Not Working**

**Symptoms:**
- App can't connect to SpacetimeDB
- Authentication fails

**Solution:**
1. Verify variables are set in Vercel
2. Check variable names (typos?)
3. Ensure applied to correct environments
4. Redeploy after adding variables

### **Domain Not Working**

**Symptoms:**
- DNS_PROBE_FINISHED_NXDOMAIN
- ERR_NAME_NOT_RESOLVED

**Solution:**
1. Check DNS records di domain provider
2. Wait longer (up to 24 hours untuk propagation)
3. Use DNS checker: https://dnschecker.org
4. Verify A record: 76.76.21.21
5. Verify CNAME: cname.vercel-dns.com

### **Slow Build Times**

**Causes:**
- Large node_modules
- Slow dependencies
- Too many files

**Solutions:**
```bash
# Use .vercelignore
echo "node_modules" >> .vercelignore
echo ".next" >> .vercelignore
echo "*.md" >> .vercelignore

# Optimize package.json
# Remove unused dependencies
pnpm prune

# Use pnpm (faster than npm)
# Already configured!
```

---

## 📈 Post-Deployment Checklist

### **Immediately After First Deploy:**

- [ ] Visit production URL
- [ ] Test authentication (Neynar + Wallet)
- [ ] Create test round (admin)
- [ ] Submit test guess
- [ ] Test check-in system
- [ ] Test chat
- [ ] Check mobile responsiveness
- [ ] Verify SpacetimeDB connection

### **Update Third-Party Services:**

- [ ] Update Neynar redirect URIs dengan production URL
- [ ] Update WalletConnect allowed domains
- [ ] Update Farcaster manifest URL
- [ ] Test integrations end-to-end

### **Monitor:**

- [ ] Check Vercel Analytics
- [ ] Monitor SpacetimeDB logs
- [ ] Watch for errors in Function Logs
- [ ] Test from different devices/browsers

---

## 🔄 Continuous Deployment Best Practices

### **Git Workflow:**

```bash
# Feature development
main (production)
  └─ develop (staging)
      └─ feature/your-feature (preview)

# Process:
1. Create feature branch from develop
2. Make changes, test locally
3. Push → auto-preview deployment
4. Create PR to develop
5. Review preview URL
6. Merge to develop → staging deployment
7. Test staging thoroughly
8. Merge develop to main → production deployment
```

### **Deployment Schedule:**

- **Hotfixes:** Immediate deploy to main
- **Features:** Weekly deploy cycle
- **Breaking changes:** Scheduled maintenance window

### **Rollback Strategy:**

If production deployment has issues:

1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click three dots → **"Promote to Production"**
4. Instant rollback!

Or via Git:
```bash
git revert HEAD
git push origin main
```

---

## 📚 Resources

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Next.js on Vercel:** https://vercel.com/docs/frameworks/nextjs
- **CLI Reference:** https://vercel.com/docs/cli
- **Status Page:** https://vercel-status.com
- **Support:** https://vercel.com/support

---

## ✅ Final Checklist

### **Pre-Deployment:**
- [ ] Code pushed to GitHub
- [ ] Environment variables ready
- [ ] Neynar setup complete
- [ ] WalletConnect setup complete
- [ ] SpacetimeDB published
- [ ] Local build successful

### **Deployment:**
- [ ] Vercel account created
- [ ] Project imported
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] Production URL obtained

### **Post-Deployment:**
- [ ] App URL updated in env vars
- [ ] Third-party services updated
- [ ] End-to-end testing complete
- [ ] Analytics enabled
- [ ] Monitoring setup
- [ ] Documentation updated

---

**Next:** [05-COMPLETE-INTEGRATION.md](./05-COMPLETE-INTEGRATION.md) - Final integration testing dan launch checklist
