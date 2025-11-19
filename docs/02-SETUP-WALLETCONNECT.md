# 💳 Tutorial Setup WalletConnect Dashboard

## Apa itu WalletConnect?

WalletConnect adalah protokol open-source untuk menghubungkan dApps dengan crypto wallets. Dengan WalletConnect, users bisa:
- ✅ Connect wallet (MetaMask, Coinbase Wallet, Rainbow, etc)
- ✅ Sign transactions
- ✅ Sign messages untuk authentication
- ✅ Switch networks (Base, Arbitrum, Ethereum, dll)

---

## 📋 Step-by-Step Setup WalletConnect

### **Step 1: Buat Akun WalletConnect**

1. Buka browser dan pergi ke: **https://cloud.walletconnect.com**

2. Klik tombol **"Sign Up"** atau **"Get Started"**

3. Pilih metode registrasi:
   - **Email + Password** (Recommended)
   - GitHub OAuth
   - Google OAuth

4. Verify email Anda

5. Setelah verify, Anda akan masuk ke **WalletConnect Cloud Dashboard**

---

### **Step 2: Buat Project Baru**

1. Di dashboard, klik tombol **"Create New Project"** atau **"+ New Project"**

2. Isi form project:
   ```
   Project Name: Bitcoin Blocks
   Description: Bitcoin prediction game with wallet authentication
   Homepage URL: https://your-app.vercel.app
   ```

3. Klik **"Create"**

4. Anda akan diarahkan ke project dashboard

---

### **Step 3: Copy Project ID**

1. Di project dashboard, Anda akan melihat **Project ID** di bagian atas:
   ```
   Project ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

2. **Copy Project ID** ini - Anda akan memerlukannya untuk integrasi

3. Keep this page open - kita akan configure settings

---

### **Step 4: Configure Project Settings**

#### **4.1 - Allowed Domains**

1. Scroll ke section **"Settings"** → **"Domains"**

2. Tambahkan domains yang diizinkan:
   ```
   Production:
   - your-app.vercel.app
   - www.your-app.vercel.app
   
   Development:
   - localhost:3000
   - 127.0.0.1:3000
   - *.vercel.app (untuk preview deployments)
   ```

3. Klik **"Add Domain"** untuk setiap entry

4. Klik **"Save"**

#### **4.2 - Supported Networks**

1. Scroll ke section **"Networks"**

2. Enable networks yang Anda gunakan:
   - ✅ **Base (Chain ID: 8453)** - REQUIRED untuk project ini
   - ✅ **Arbitrum (Chain ID: 42161)** - REQUIRED untuk project ini
   - ✅ Ethereum Mainnet (1) - Optional
   - ✅ Polygon (137) - Optional
   - ✅ Optimism (10) - Optional

3. Klik **"Save Networks"**

#### **4.3 - App Metadata**

1. Scroll ke section **"App Info"**

2. Upload assets:
   ```
   App Name: Bitcoin Blocks
   Description: Predict Bitcoin block transactions and earn rewards
   URL: https://your-app.vercel.app
   Icon URL: https://your-app.vercel.app/icon.png (192x192 px)
   ```

3. Metadata ini akan muncul di wallet saat user connect

4. Klik **"Save"**

---

### **Step 5: Setup Explorer (Optional - untuk custom wallet list)**

WalletConnect Explorer memungkinkan Anda customize wallet list yang muncul:

1. Klik tab **"Explorer"**

2. Default: semua wallets ditampilkan

3. Untuk customize:
   - Enable **"Custom Wallet List"**
   - Pilih wallets yang ingin ditampilkan:
     - MetaMask
     - Coinbase Wallet
     - Rainbow
     - Trust Wallet
     - Ledger Live
     - ... dll

4. Atur urutan dengan drag & drop

5. Klik **"Save"**

---

### **Step 6: Monitor Analytics**

Dashboard menyediakan analytics:

1. Klik tab **"Analytics"**

2. Metrics yang bisa dilihat:
   - **Connection Attempts** - berapa kali users coba connect
   - **Successful Connections** - berapa connections yang berhasil
   - **Failed Connections** - debug connection issues
   - **Active Sessions** - berapa sessions aktif saat ini
   - **Popular Wallets** - wallet mana yang paling banyak dipakai

3. Filter by date range untuk historical data

---

## 🔧 Integrasi ke Project Bitcoin Blocks

### **Step 7: Set Environment Variables**

Setelah dapat Project ID, tambahkan ke environment variables:

#### **Local Development (.env.local)**
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### **Vercel Production**
1. Buka Vercel Dashboard
2. Pilih project **bitcoin-blocks**
3. Klik tab **"Settings"**
4. Klik **"Environment Variables"**
5. Tambahkan:
   ```
   Key: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   Environment: Production, Preview, Development
   ```
6. Klik **"Save"**

---

### **Step 8: Test Locally**

1. Start development server:
   ```bash
   pnpm dev
   ```

2. Buka browser: http://localhost:3000

3. Klik **"Connect Wallet"**

4. Pilih wallet (contoh: MetaMask)

5. Approve connection di wallet

6. Check console untuk logs:
   ```javascript
   Connected to wallet: 0x1234...5678
   Chain ID: 8453 (Base)
   ```

---

## 🎯 Cara Kerja Wallet Authentication

### **Flow di Bitcoin Blocks:**

```
┌──────────────────────────────────────────────────────┐
│  1. User klik "Connect Wallet"                        │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  2. RainbowKit modal muncul                           │
│     menampilkan wallet options                        │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  3. User pilih wallet (MetaMask/Coinbase/etc)        │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  4. WalletConnect establish connection                │
│     - Desktop: QR code atau browser extension        │
│     - Mobile: Deep link ke wallet app                │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  5. User approve connection di wallet                 │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  6. Wagmi hooks receive address & chainId            │
│     address: 0x1234...5678                           │
│     chainId: 8453 (Base)                             │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  7. AuthContext update user state                    │
│     userId: wallet address                           │
│     authMethod: 'wallet'                             │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  8. User logged in! Can interact with app            │
└──────────────────────────────────────────────────────┘
```

---

## 🌐 Network Configuration

Bitcoin Blocks mendukung **Base** dan **Arbitrum**. Berikut konfigurasi networks:

### **Base Network**
```typescript
{
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.base.org'] },
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
}
```

### **Arbitrum Network**
```typescript
{
  id: 42161,
  name: 'Arbitrum One',
  network: 'arbitrum',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://arb1.arbitrum.io/rpc'] },
    default: { http: ['https://arb1.arbitrum.io/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
  },
}
```

---

## 🎨 Customize RainbowKit Theme

Project sudah menggunakan RainbowKit dengan konfigurasi default. Untuk customize:

### **1. Change Theme**

Edit `src/lib/wallet-config.ts`:

```typescript
import '@rainbow-me/rainbowkit/styles.css';
import { darkTheme, lightTheme } from '@rainbow-me/rainbowkit';

// Dark theme (current)
const theme = darkTheme({
  accentColor: '#F7931A', // Bitcoin orange
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
});

// Light theme (alternative)
const theme = lightTheme({
  accentColor: '#F7931A',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
});
```

### **2. Custom Colors**

```typescript
const theme = darkTheme({
  accentColor: '#7b3fe4', // Purple
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});
```

### **3. Custom Wallet List**

Edit `src/lib/wallet-config.ts`:

```typescript
import {
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      metaMaskWallet({ projectId }),
      coinbaseWallet({ appName: 'Bitcoin Blocks' }),
      rainbowWallet({ projectId }),
    ],
  },
  {
    groupName: 'Other',
    wallets: [
      walletConnectWallet({ projectId }),
      trustWallet({ projectId }),
    ],
  },
]);
```

---

## 🔒 Security Best Practices

### **1. Project ID Protection**
- ✅ NEXT_PUBLIC_* variables aman untuk client-side
- ✅ Project ID tidak sensitive (public di frontend)
- ✅ Rate limiting handled by WalletConnect

### **2. Transaction Signing**
- ✅ Always verify transaction params sebelum sign
- ✅ Show clear confirmation messages
- ✅ Validate contract addresses

### **3. Network Validation**
```typescript
// Example: Ensure user on correct network
const { chain } = useNetwork();

if (chain?.id !== 8453) { // Not on Base
  await switchNetwork?.(8453); // Switch to Base
}
```

### **4. Handle Disconnections**
```typescript
const { disconnect } = useDisconnect();

// Logout handler
const handleLogout = () => {
  disconnect();
  // Clear local state
  // Redirect to home
};
```

---

## 📊 WalletConnect Cloud Pricing

### **Free Tier**
- ✅ Unlimited connections
- ✅ Basic analytics
- ✅ All major wallets supported
- ✅ Community support

**Perfect untuk Bitcoin Blocks!** Tidak perlu paid plan untuk production.

### **Pro Tier ($49/month) - Optional**
- ✅ Advanced analytics
- ✅ Custom branding
- ✅ Priority support
- ✅ Higher rate limits

### **Enterprise - Custom pricing**
- ✅ Dedicated infrastructure
- ✅ SLA guarantees
- ✅ White-label solutions

---

## 🐛 Troubleshooting

### **Error: Invalid Project ID**
```
Solution:
1. Check NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID di .env
2. Pastikan tidak ada extra spaces
3. Verify Project ID di cloud.walletconnect.com
4. Restart dev server setelah update .env
```

### **Error: Domain not allowed**
```
Solution:
1. Tambahkan domain ke Allowed Domains di WalletConnect dashboard
2. Include localhost:3000 untuk development
3. Wait 5 minutes untuk propagation
```

### **Wallet tidak muncul di list**
```
Solution:
1. Check wallet installed di browser/device
2. Verify wallet supported by WalletConnect
3. Clear browser cache
4. Try different browser
```

### **Connection timeout**
```
Solution:
1. Check internet connection
2. Verify WalletConnect status: https://status.walletconnect.com
3. Try different wallet
4. Check firewall/VPN settings
```

### **Wrong network selected**
```
Solution:
1. Use switchNetwork from wagmi
2. Show clear message to user
3. Auto-switch to correct network
```

---

## 🧪 Testing Guide

### **Test Checklist:**

#### **Desktop:**
- [ ] MetaMask browser extension connection
- [ ] Coinbase Wallet extension
- [ ] WalletConnect QR code scan dengan mobile wallet
- [ ] Network switch: Base ↔️ Arbitrum
- [ ] Disconnect dan reconnect
- [ ] Multiple accounts switching

#### **Mobile:**
- [ ] MetaMask mobile app
- [ ] Coinbase Wallet mobile
- [ ] Rainbow wallet
- [ ] Trust Wallet
- [ ] Deep link functionality

#### **Edge Cases:**
- [ ] User reject connection
- [ ] User reject network switch
- [ ] Connection timeout
- [ ] Wallet locked
- [ ] No wallet installed

---

## 📚 Resources

- **WalletConnect Cloud:** https://cloud.walletconnect.com
- **Documentation:** https://docs.walletconnect.com
- **RainbowKit Docs:** https://www.rainbowkit.com/docs
- **Wagmi Docs:** https://wagmi.sh
- **Status Page:** https://status.walletconnect.com
- **Discord Support:** https://discord.gg/walletconnect

---

## ✅ Checklist Setup WalletConnect

- [ ] Buat akun di cloud.walletconnect.com
- [ ] Create new project
- [ ] Copy Project ID
- [ ] Add allowed domains
- [ ] Enable Base & Arbitrum networks
- [ ] Set app metadata
- [ ] Add Project ID ke .env.local
- [ ] Test wallet connection locally
- [ ] Add Project ID ke Vercel environment
- [ ] Test on production
- [ ] Monitor analytics

---

**Next:** [03-DEPLOY-SPACETIMEDB.md](./03-DEPLOY-SPACETIMEDB.md) - Deploy backend ke SpacetimeDB maincloud
