# 📚 Bitcoin Blocks - Complete Deployment Guide

## Welcome! 👋

This comprehensive documentation will guide you through **every step** needed to deploy **Bitcoin Blocks** - from setting up third-party services to launching your production app.

---

## 🎯 What You'll Learn

By following these tutorials, you will:

1. ✅ Setup **Neynar** for Farcaster authentication (Sign in with Warpcast)
2. ✅ Setup **WalletConnect** for crypto wallet integration (Base & Arbitrum)
3. ✅ Deploy **SpacetimeDB** backend to maincloud (real-time database)
4. ✅ Deploy **Frontend** to Vercel (Next.js app)
5. ✅ Complete **end-to-end integration testing**
6. ✅ Launch your **production-ready app**

---

## 📖 Tutorial Index

Follow these tutorials **in order** for best results:

### **1️⃣ [Setup Neynar Dashboard](./01-SETUP-NEYNAR.md)**
**Estimated time:** 15 minutes

Learn how to:
- Create Neynar account
- Generate API keys
- Setup OAuth app for "Sign in with Warpcast"
- Configure webhooks
- Integrate into Bitcoin Blocks

**Prerequisites:**
- Email or Farcaster account
- Browser

---

### **2️⃣ [Setup WalletConnect Dashboard](./02-SETUP-WALLETCONNECT.md)**
**Estimated time:** 15 minutes

Learn how to:
- Create WalletConnect account
- Generate Project ID
- Configure allowed domains
- Enable Base & Arbitrum networks
- Customize wallet list
- Integrate into Bitcoin Blocks

**Prerequisites:**
- Email account
- Production URL (from Vercel - can add later)

---

### **3️⃣ [Deploy SpacetimeDB Backend](./03-DEPLOY-SPACETIMEDB.md)**
**Estimated time:** 30 minutes

Learn how to:
- Install SpacetimeDB CLI
- Create identity
- Publish module to testnet
- Deploy to maincloud (production)
- Update database schemas
- Monitor logs and metrics
- Manage database backups

**Prerequisites:**
- Terminal/command line access
- macOS, Linux, or Windows
- SpacetimeDB account (for maincloud)

---

### **4️⃣ [Deploy Frontend to Vercel](./04-DEPLOY-VERCEL.md)**
**Estimated time:** 20 minutes

Learn how to:
- Create Vercel account
- Import GitHub repository
- Configure build settings
- Set environment variables
- Setup custom domain
- Enable auto-deployments
- Monitor analytics

**Prerequisites:**
- GitHub account
- Git repository with Bitcoin Blocks code
- Neynar Client ID (from tutorial #1)
- WalletConnect Project ID (from tutorial #2)
- SpacetimeDB host URL (from tutorial #3)

---

### **5️⃣ [Complete Integration & Testing](./05-COMPLETE-INTEGRATION.md)**
**Estimated time:** 1 hour

Learn how to:
- Verify all environment variables
- Test authentication flows
- Test game features end-to-end
- Test on multiple devices/browsers
- Handle errors gracefully
- Setup monitoring
- Launch production app

**Prerequisites:**
- All previous tutorials completed
- App deployed to Vercel
- SpacetimeDB module published

---

## 🚀 Quick Start (Already Familiar?)

If you're experienced with these tools:

```bash
# 1. Get API keys
Neynar: https://dev.neynar.com (OAuth Client ID)
WalletConnect: https://cloud.walletconnect.com (Project ID)

# 2. Deploy SpacetimeDB
cd spacetime-server
spacetime publish bitcoin-blocks --host mainnet.spacetimedb.com

# 3. Set Vercel env vars
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks
NEXT_PUBLIC_NEYNAR_CLIENT_ID=your_client_id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# 4. Deploy to Vercel
git push origin main  # Auto-deploy

# 5. Test everything
# Follow tutorial #5 for comprehensive testing
```

---

## 🎓 Recommended Learning Path

### **For Beginners:**

If you're new to web3 or deployment:

1. **Day 1:** Read through all tutorials (don't do anything yet)
2. **Day 2:** Tutorial #1 (Neynar) + Tutorial #2 (WalletConnect)
3. **Day 3:** Tutorial #3 (SpacetimeDB)
4. **Day 4:** Tutorial #4 (Vercel)
5. **Day 5:** Tutorial #5 (Testing & Launch)

### **For Experienced Developers:**

If you're comfortable with APIs and deployment:

1. **Morning:** Tutorials #1-2 (Get API keys)
2. **Afternoon:** Tutorials #3-4 (Deploy backend & frontend)
3. **Evening:** Tutorial #5 (Testing)
4. **Next Day:** Launch! 🚀

---

## 🛠️ Tech Stack Overview

Understanding the architecture helps:

```
┌─────────────────────────────────────────────────────┐
│               FRONTEND (Vercel)                      │
│  - Next.js 14 (App Router)                          │
│  - React 18                                          │
│  - TypeScript                                        │
│  - Tailwind CSS + Radix UI                          │
│  - RainbowKit + Wagmi (wallet)                      │
└─────────────────────────────────────────────────────┘
                      ↕️
┌─────────────────────────────────────────────────────┐
│             AUTHENTICATION                           │
│  - Neynar (Farcaster OAuth)                         │
│  - Farcaster SDK (Mini App)                         │
│  - WalletConnect (Base, Arbitrum)                   │
└─────────────────────────────────────────────────────┘
                      ↕️
┌─────────────────────────────────────────────────────┐
│         BACKEND (SpacetimeDB Maincloud)              │
│  - Real-time database                                │
│  - Rust reducers (server logic)                     │
│  - WebSocket subscriptions                          │
└─────────────────────────────────────────────────────┘
```

---

## 💰 Cost Breakdown

Transparency about pricing:

| Service | Free Tier | Paid Plan | Recommended for Bitcoin Blocks |
|---------|-----------|-----------|-------------------------------|
| **Vercel** | Unlimited deployments, 100 GB bandwidth | $20/month Pro | ✅ Free (Hobby) |
| **Neynar** | 1,000 req/day | $99/month Pro | ✅ Free initially |
| **WalletConnect** | Unlimited connections | $49/month | ✅ Free |
| **SpacetimeDB** | Maincloud $49/month | Enterprise custom | ⚠️ $49/month (production-ready) |

**Total estimated cost for production:** $49-69/month

**Note:** Using maincloud for both development and production for consistency and reliability.

---

## 📊 Deployment Checklist

Use this to track your progress:

### **Setup Phase:**
- [ ] Read all tutorial documentation
- [ ] Understand architecture
- [ ] Prepare GitHub repository
- [ ] Have credit card ready (for paid services)

### **API Keys Phase:**
- [ ] Neynar account created
- [ ] Neynar Client ID obtained
- [ ] WalletConnect account created
- [ ] WalletConnect Project ID obtained

### **Deployment Phase:**
- [ ] SpacetimeDB CLI installed
- [ ] SpacetimeDB module published
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set

### **Integration Phase:**
- [ ] OAuth redirect URIs updated
- [ ] Domains whitelisted
- [ ] Farcaster manifest configured

### **Testing Phase:**
- [ ] Authentication tested (all 3 methods)
- [ ] Game features tested
- [ ] Mobile/desktop compatibility verified
- [ ] Performance optimized

### **Launch Phase:**
- [ ] Production deployed
- [ ] Monitoring enabled
- [ ] Users invited
- [ ] 🎉 LIVE!

---

## 🆘 Getting Help

### **During Setup:**

Each tutorial includes:
- ✅ Step-by-step instructions with screenshots
- ✅ Troubleshooting sections
- ✅ Common errors & solutions
- ✅ Links to official documentation

### **Community Support:**

Join these Discord servers for help:
- **Neynar:** https://discord.gg/neynar
- **WalletConnect:** https://discord.gg/walletconnect
- **SpacetimeDB:** https://discord.gg/spacetimedb
- **Vercel:** https://discord.gg/vercel

### **Official Documentation:**

- **Neynar:** https://docs.neynar.com
- **WalletConnect:** https://docs.walletconnect.com
- **SpacetimeDB:** https://docs.spacetimedb.com
- **Vercel:** https://vercel.com/docs
- **Next.js:** https://nextjs.org/docs

---

## 🎯 Success Criteria

You'll know you're successful when:

1. ✅ Users can sign in via Warpcast (Neynar)
2. ✅ Users can connect wallets (Base/Arbitrum)
3. ✅ Admins can create game rounds
4. ✅ Users can submit predictions
5. ✅ Real-time updates work instantly
6. ✅ Daily check-ins award points
7. ✅ Chat messages sync across clients
8. ✅ Leaderboards update automatically
9. ✅ App loads fast (< 3 seconds)
10. ✅ No console errors or warnings

---

## 📝 Additional Resources

### **Project Files:**

```
docs/
├── README.md (this file)
├── 01-SETUP-NEYNAR.md
├── 02-SETUP-WALLETCONNECT.md
├── 03-DEPLOY-SPACETIMEDB.md
├── 04-DEPLOY-VERCEL.md
└── 05-COMPLETE-INTEGRATION.md

Root files:
├── DEPLOYMENT_GUIDE.md (comprehensive overview)
├── QUICK_DEPLOY.md (quick reference)
├── .env.example (environment variables template)
└── vercel.json (Vercel configuration)
```

### **Code Structure:**

```
src/
├── app/                 # Next.js pages
├── components/          # React components
├── context/            # React Context (Auth, Game)
├── lib/                # Utilities (SpacetimeDB, wallet)
└── hooks/              # Custom React hooks

spacetime-server/
└── src/
    └── lib.rs          # SpacetimeDB schema & reducers
```

---

## 🚦 Current Status

This codebase is **production-ready** with:

- ✅ Mock mode completely removed
- ✅ Pure real-time architecture
- ✅ Dual authentication (Neynar + Wallet)
- ✅ Daily check-in system
- ✅ Global chat
- ✅ Admin panel
- ✅ Mobile responsive
- ✅ PNPM v10.20 compatible

**Ready to deploy! Just follow the tutorials.** 🚀

---

## 🎊 Let's Get Started!

Begin with: **[Tutorial #1: Setup Neynar Dashboard](./01-SETUP-NEYNAR.md)**

Good luck with your deployment! 🍀

---

## 📧 Questions?

If you have questions about these tutorials:

1. Check the **Troubleshooting** section in each guide
2. Search official documentation
3. Ask in relevant Discord communities
4. Review code comments in the project

**Happy building! 🎉**
