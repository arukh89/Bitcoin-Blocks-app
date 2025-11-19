# 🔐 Tutorial Setup Neynar Dashboard

## Apa itu Neynar?

Neynar adalah platform yang menyediakan API untuk integrasi dengan Farcaster. Dengan Neynar, Anda bisa:
- ✅ Authenticate users dengan Farcaster (Sign in with Warpcast)
- ✅ Mendapatkan user profile (FID, username, profile picture)
- ✅ Membuat QR code untuk authentication
- ✅ Access Farcaster data dan social graph

---

## 📋 Step-by-Step Setup Neynar

### **Step 1: Buat Akun Neynar**

1. Buka browser dan pergi ke: **https://dev.neynar.com**

2. Klik tombol **"Sign Up"** atau **"Get Started"**

3. Pilih metode registrasi:
   - **Sign in with Warpcast** (Recommended - jika sudah punya akun Farcaster)
   - Email + Password
   - Google OAuth

4. Setelah login, Anda akan masuk ke **Neynar Dashboard**

---

### **Step 2: Buat API Key**

1. Di dashboard, klik menu **"API Keys"** di sidebar kiri

2. Klik tombol **"Create New API Key"** atau **"+ New Key"**

3. Isi form:
   ```
   Name: Bitcoin Blocks Production
   Environment: Production
   ```

4. Klik **"Create"**

5. **IMPORTANT:** Copy API Key yang muncul dan simpan dengan aman
   ```
   Example: neynar_api_key_1a2b3c4d5e6f7g8h9i0j
   ```
   
   ⚠️ **API Key hanya ditampilkan sekali!** Jika hilang, harus buat baru.

---

### **Step 3: Buat Neynar OAuth Client**

Untuk Sign in with Warpcast, kita perlu OAuth Client ID:

1. Di dashboard, klik menu **"OAuth"** atau **"Apps"**

2. Klik **"Create New OAuth App"**

3. Isi form:
   ```
   App Name: Bitcoin Blocks
   Description: Bitcoin prediction game on Farcaster
   Website: https://your-app.vercel.app (ganti setelah deploy)
   Redirect URIs: 
     - https://your-app.vercel.app/api/auth/callback
     - http://localhost:3000/api/auth/callback (untuk testing)
   Logo: (Upload logo app Anda - optional)
   ```

4. Klik **"Create App"**

5. Copy **Client ID** yang muncul:
   ```
   Example: neynar_client_xyz123abc456
   ```

---

### **Step 4: Configure Webhook (Optional - untuk notifikasi realtime)**

Jika ingin receive events dari Farcaster:

1. Klik menu **"Webhooks"**

2. Klik **"Create Webhook"**

3. Isi:
   ```
   Name: Bitcoin Blocks Events
   URL: https://your-app.vercel.app/api/webhooks/neynar
   Events: (pilih events yang Anda butuhkan)
     ✅ user.created
     ✅ user.updated
   ```

4. Copy **Webhook Secret** untuk verify signature

---

### **Step 5: Test API Key**

Test API key Anda dengan curl:

```bash
curl -X GET "https://api.neynar.com/v2/farcaster/user/bulk?fids=250704,1107084" \
  -H "accept: application/json" \
  -H "api_key: YOUR_NEYNAR_API_KEY"
```

Response yang benar:
```json
{
  "users": [
    {
      "fid": 250704,
      "username": "username1",
      "display_name": "Display Name",
      "pfp_url": "https://...",
      ...
    }
  ]
}
```

---

## 🔧 Integrasi ke Project Bitcoin Blocks

### **Step 6: Set Environment Variables**

Setelah dapat Client ID, tambahkan ke environment variables:

#### **Local Development (.env.local)**
```bash
NEXT_PUBLIC_NEYNAR_CLIENT_ID=neynar_client_xyz123abc456
NEYNAR_API_KEY=neynar_api_key_1a2b3c4d5e6f7g8h9i0j
```

#### **Vercel Production**
1. Buka Vercel Dashboard
2. Pilih project **bitcoin-blocks**
3. Klik tab **"Settings"**
4. Klik **"Environment Variables"**
5. Tambahkan:
   ```
   Key: NEXT_PUBLIC_NEYNAR_CLIENT_ID
   Value: neynar_client_xyz123abc456
   Environment: Production, Preview, Development
   
   Key: NEYNAR_API_KEY
   Value: neynar_api_key_1a2b3c4d5e6f7g8h9i0j
   Environment: Production, Preview, Development
   ```

---

## 📊 Neynar Dashboard Overview

### **1. API Keys Tab**
- Manage multiple API keys
- Monitor usage dan rate limits
- Rotate keys untuk security

### **2. OAuth Apps Tab**
- Manage OAuth clients
- View authorized users
- Configure redirect URIs

### **3. Analytics Tab**
- API usage statistics
- Request volume over time
- Error rate monitoring

### **4. Webhooks Tab**
- Manage webhook endpoints
- View delivery logs
- Retry failed deliveries

### **5. Documentation Tab**
- API reference
- Code examples
- Integration guides

---

## 🎯 Cara Kerja Sign in with Warpcast

### **Flow di Bitcoin Blocks:**

```
┌──────────────────────────────────────────────────────┐
│  1. User klik "Sign in with Warpcast"                │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  2. Frontend generate Neynar auth URL                 │
│     https://api.neynar.com/v2/auth?client_id=...     │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  3. Neynar generate QR code dengan deep link         │
│     warpcast://sign-in?token=...                     │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  4. User scan QR dengan Warpcast mobile app          │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  5. User approve di Warpcast app                     │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  6. Neynar callback ke /api/auth/callback            │
│     dengan authorization code                        │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  7. Backend exchange code untuk access token         │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  8. Get user profile (FID, username, pfp)            │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  9. User logged in! Save to SpacetimeDB             │
└──────────────────────────────────────────────────────┘
```

---

## 🔒 Security Best Practices

### **1. API Key Protection**
- ❌ JANGAN commit API key ke Git
- ✅ Gunakan environment variables
- ✅ Rotate keys secara berkala
- ✅ Use different keys untuk dev/prod

### **2. OAuth Configuration**
- ✅ Whitelist redirect URIs yang valid saja
- ✅ Validate state parameter untuk CSRF protection
- ✅ Use HTTPS untuk production URLs

### **3. Rate Limiting**
Neynar Free Plan limits:
- **1,000 requests/day**
- **100 requests/hour**

Untuk production dengan traffic tinggi, upgrade ke paid plan.

---

## 📈 Pricing Plans

### **Free Plan**
- ✅ 1,000 API requests/day
- ✅ Basic Farcaster data access
- ✅ OAuth authentication
- ❌ Limited webhook events

### **Pro Plan ($99/month)**
- ✅ 100,000 API requests/day
- ✅ Full Farcaster data access
- ✅ All webhook events
- ✅ Priority support

### **Enterprise Plan (Custom)**
- ✅ Unlimited requests
- ✅ Custom SLA
- ✅ Dedicated support
- ✅ Custom features

---

## 🐛 Troubleshooting

### **Error: Invalid API Key**
```
Solution: 
1. Check API key di .env file
2. Pastikan tidak ada extra spaces
3. Generate new key jika perlu
```

### **Error: Unauthorized redirect_uri**
```
Solution:
1. Tambahkan URL ke OAuth app settings
2. Pastikan URL exact match (including https/http)
3. Redeploy app setelah update
```

### **Error: Rate limit exceeded**
```
Solution:
1. Implement caching untuk reduce API calls
2. Batch requests jika possible
3. Upgrade to paid plan
```

### **QR Code tidak muncul**
```
Solution:
1. Check NEXT_PUBLIC_NEYNAR_CLIENT_ID di environment
2. Check browser console untuk errors
3. Verify Neynar API status
```

---

## 📚 Resources

- **Neynar Dashboard:** https://dev.neynar.com
- **API Documentation:** https://docs.neynar.com
- **API Reference:** https://docs.neynar.com/reference
- **Discord Support:** https://discord.gg/neynar
- **Status Page:** https://status.neynar.com

---

## ✅ Checklist Setup Neynar

- [ ] Buat akun di dev.neynar.com
- [ ] Generate API Key
- [ ] Create OAuth App
- [ ] Copy Client ID
- [ ] Set environment variables di .env.local
- [ ] Test API key dengan curl
- [ ] Add Client ID ke Vercel environment
- [ ] Test Sign in with Warpcast
- [ ] Monitor usage di dashboard

---

**Next:** [02-SETUP-WALLETCONNECT.md](./02-SETUP-WALLETCONNECT.md) - Setup WalletConnect untuk wallet authentication
