# 🎯 Complete Integration Testing & Launch

## Overview

Tutorial ini adalah **langkah terakhir** setelah semua services di-setup dan di-deploy. Anda akan melakukan end-to-end testing dan final configuration untuk production launch.

---

## 📋 Prerequisites Checklist

Pastikan semua ini sudah selesai:

- [x] **Neynar** - Client ID obtained dan OAuth configured
- [x] **WalletConnect** - Project ID obtained dan domains whitelisted
- [x] **SpacetimeDB** - Module published ke testnet/maincloud
- [x] **Vercel** - App deployed dan environment variables set
- [x] **GitHub** - Code repository setup

---

## 🔗 Step 1: Verify All Environment Variables

### **1.1 - Check Vercel Environment Variables**

Go to: Vercel Dashboard → bitcoin-blocks → Settings → Environment Variables

Verify these are all set:

```bash
# SpacetimeDB
NEXT_PUBLIC_SPACETIME_HOST=wss://mainnet.spacetimedb.com
NEXT_PUBLIC_SPACETIME_DB_NAME=bitcoin-blocks

# Neynar
NEXT_PUBLIC_NEYNAR_CLIENT_ID=neynar_client_xxxxx
NEYNAR_API_KEY=neynar_api_key_xxxxx

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### **1.2 - Update OAuth Redirect URIs**

#### **Neynar Dashboard:**
1. Go to: https://dev.neynar.com
2. OAuth Apps → bitcoin-blocks → Settings
3. Add redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback
   ```
4. Save

#### **Farcaster Manifest:**
1. Verify `public/.well-known/farcaster.json` has correct URL:
   ```json
   {
     "accountAssociation": {
       "header": "...",
       "payload": "...",
       "signature": "..."
     },
     "frame": {
       "version": "1",
       "name": "Bitcoin Blocks",
       "iconUrl": "https://your-app.vercel.app/icon.png",
       "homeUrl": "https://your-app.vercel.app",
       "imageUrl": "https://your-app.vercel.app/splash.png",
       "buttonTitle": "Play Bitcoin Blocks",
       "splashImageUrl": "https://your-app.vercel.app/splash.png",
       "splashBackgroundColor": "#000000",
       "webhookUrl": "https://your-app.vercel.app/api/webhooks/farcaster"
     }
   }
   ```

### **1.3 - Update WalletConnect Domains**

1. Go to: https://cloud.walletconnect.com
2. Select bitcoin-blocks project
3. Settings → Allowed Domains
4. Add:
   ```
   your-app.vercel.app
   www.your-app.vercel.app
   ```
5. Save

---

## 🧪 Step 2: End-to-End Testing

### **Test Plan Overview:**

```
┌─────────────────────────────────────────────────────┐
│  Phase 1: Basic Functionality                       │
│  - Page load                                        │
│  - UI rendering                                     │
│  - SpacetimeDB connection                          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Phase 2: Authentication                            │
│  - Sign in with Warpcast (Neynar)                  │
│  - Connect Wallet (WalletConnect)                  │
│  - Farcaster SDK (mini app context)                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Phase 3: Core Features                             │
│  - Create round (admin)                             │
│  - Submit guess (user)                              │
│  - Update result (admin)                            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Phase 4: Additional Features                       │
│  - Daily check-in                                   │
│  - Global chat                                      │
│  - Leaderboards                                     │
└─────────────────────────────────────────────────────┘
```

---

### **2.1 - Test Basic Functionality**

#### **Desktop Browser:**

1. Open production URL: `https://your-app.vercel.app`

2. **Check page load:**
   - [ ] Page loads within 3 seconds
   - [ ] No console errors
   - [ ] Loading screen shows properly
   - [ ] Bitcoin logo visible

3. **Check UI elements:**
   - [ ] Header dengan app name
   - [ ] "Connect" button visible
   - [ ] "All Predictions" section
   - [ ] Daily Check-In component
   - [ ] Global Chat
   - [ ] Leaderboards

4. **Open Developer Console (F12):**
   ```javascript
   // Check for errors
   // Should see: "SpacetimeDB connected successfully"
   ```

#### **Mobile Browser:**

1. Open di mobile device: `https://your-app.vercel.app`

2. **Check responsive design:**
   - [ ] Layout adjusts properly
   - [ ] Text readable (not too small)
   - [ ] Buttons tap-able
   - [ ] No horizontal scroll

---

### **2.2 - Test Authentication**

#### **Test 1: Sign in with Warpcast (Neynar)**

**Desktop:**

1. Click **"Connect"** button

2. Modal muncul dengan options:
   - Sign in with Warpcast
   - Connect Wallet

3. Click **"Sign in with Warpcast"**

4. QR code muncul

5. Open **Warpcast mobile app**

6. Scan QR code

7. Approve di Warpcast

8. **Expected result:**
   - [ ] QR modal closes
   - [ ] User logged in
   - [ ] Username shows di header
   - [ ] Profile picture visible
   - [ ] Console log: `Neynar auth successful, FID: 250704`

**Mobile:**

1. Open di mobile browser

2. Click **"Sign in with Warpcast"**

3. Deep link ke Warpcast app

4. Approve

5. Return to browser

6. **Expected result:**
   - [ ] User logged in automatically
   - [ ] No need to scan QR

#### **Test 2: Connect Wallet (WalletConnect)**

**Desktop dengan MetaMask:**

1. Refresh page (clear session)

2. Click **"Connect"**

3. Click **"Connect Wallet"**

4. RainbowKit modal muncul

5. Select **"MetaMask"**

6. MetaMask extension popup

7. Approve connection

8. **Expected result:**
   - [ ] Wallet connected
   - [ ] Address shows di header: `0x1234...5678`
   - [ ] Network badge shows: "Base" atau "Arbitrum"
   - [ ] Console log: `Wallet connected: 0x...`

**Network Switch Test:**

1. After connected, switch network:
   - Click network badge → Select "Arbitrum"

2. MetaMask prompt untuk switch

3. Approve

4. **Expected result:**
   - [ ] Network badge updates to "Arbitrum"
   - [ ] No connection loss
   - [ ] Console log: `Network switched to: 42161`

**Mobile dengan Coinbase Wallet:**

1. Open di mobile browser

2. Click **"Connect Wallet"**

3. Select **"Coinbase Wallet"**

4. Deep link ke Coinbase Wallet app

5. Approve connection

6. Return to browser

7. **Expected result:**
   - [ ] Wallet connected
   - [ ] Address visible

#### **Test 3: Farcaster SDK (Mini App)**

1. Open app **inside Warpcast** (mini app context)

2. **Expected result:**
   - [ ] Auto-login dengan Farcaster FID
   - [ ] No need untuk manual login
   - [ ] Username dari Farcaster profile
   - [ ] Profile picture dari Farcaster
   - [ ] Console log: `Farcaster SDK ready`

---

### **2.3 - Test Core Game Features**

#### **Test 1: Admin Create Round**

**Prerequisites:** Login dengan admin FID (250704 atau 1107084)

1. Admin panel button muncul di header

2. Click **"Admin Panel"**

3. Fill create round form:
   ```
   Round Number: 1
   Duration: 10 (minutes)
   Prize: 5,000 $SECOND
   Block Number: 875420 (optional)
   ```

4. Click **"Create Round"**

5. **Expected result:**
   - [ ] Success message
   - [ ] Round muncul di "Current Round" section
   - [ ] Countdown timer starts
   - [ ] Prize displayed
   - [ ] Block number shown
   - [ ] Console log: `Round created successfully`
   - [ ] SpacetimeDB log shows insert to rounds table

#### **Test 2: User Submit Guess**

**Prerequisites:** Login sebagai regular user (non-admin)

1. Active round visible

2. Guess form shows

3. Input prediction:
   ```
   Guess: 2500 (transactions)
   ```

4. Click **"Submit Guess"**

5. **Expected result:**
   - [ ] Success message
   - [ ] Guess form disabled (already submitted)
   - [ ] Your guess shows di "All Predictions"
   - [ ] Leaderboard updates
   - [ ] Console log: `Guess submitted successfully`
   - [ ] SpacetimeDB log shows insert to guesses table

6. **Multi-user test:** Open incognito window, login dengan different user, submit different guess

7. **Expected result:**
   - [ ] Both guesses visible di original window (real-time sync)
   - [ ] Leaderboard updates with both users

#### **Test 3: Admin Update Result**

**Prerequisites:** Round closed (wait for timer atau manually close)

1. Admin panel → Update result section

2. Fill form:
   ```
   Round ID: 1
   Actual TX Count: 2834
   Block Hash: 00000000000000000003...
   ```

3. Or click **"Fetch BTC Block"** untuk auto-fill

4. Click **"Update Result"**

5. **Expected result:**
   - [ ] Success message
   - [ ] Winner calculated automatically
   - [ ] Winner badge shows di leaderboard
   - [ ] Round status: "Finished"
   - [ ] Actual TX count displayed
   - [ ] System message di chat: "Winner announced!"
   - [ ] Console log: `Round result updated, Winner: username`

---

### **2.4 - Test Additional Features**

#### **Test 1: Daily Check-In**

1. Login (any method)

2. Daily Check-In component visible

3. Click **"Check In Today"**

4. **Expected result:**
   - [ ] Success message
   - [ ] Points awarded (+10)
   - [ ] Check-in button disabled until tomorrow
   - [ ] Message: "Come back tomorrow for more points!"
   - [ ] Check-in leaderboard updates
   - [ ] SpacetimeDB log shows insert to user_check_ins

5. **Streak test:** Check in consecutive days (test dengan manipulate date di reducer)

6. **Expected result:**
   - [ ] Streak counter increases
   - [ ] Bonus points on day 7 (+50)

#### **Test 2: Global Chat**

1. Login

2. Chat section visible di bottom

3. Type message:
   ```
   Hello from Bitcoin Blocks!
   ```

4. Press Enter atau click Send

5. **Expected result:**
   - [ ] Message appears immediately
   - [ ] Username dan profile picture shown
   - [ ] Timestamp displayed
   - [ ] Console log: `Chat message sent`

6. **Multi-user test:** Open another browser, login, send message

7. **Expected result:**
   - [ ] Message appears in both windows (real-time)
   - [ ] Auto-scroll to bottom

#### **Test 3: Leaderboards**

**Check-In Leaderboard:**

1. Navigate to Check-In Leaderboard tab

2. **Expected data:**
   - [ ] Users sorted by current streak
   - [ ] Streak days displayed
   - [ ] Total check-ins count
   - [ ] Points shown
   - [ ] Profile pictures

**Game Leaderboard (All Predictions):**

1. Navigate to All Predictions tab

2. **Expected data:**
   - [ ] Users sorted by accuracy (after round finished)
   - [ ] Guess amounts shown
   - [ ] Winner badge visible
   - [ ] Real-time updates when new guesses submitted

---

## 🔍 Step 3: Performance Testing

### **3.1 - Lighthouse Audit**

1. Open Chrome DevTools (F12)

2. Tab **"Lighthouse"**

3. Select:
   - [x] Performance
   - [x] Accessibility
   - [x] Best Practices
   - [x] SEO

4. Click **"Analyze page load"**

5. **Target Scores:**
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

6. **If scores low, optimize:**
   - Compress images
   - Enable caching
   - Reduce JavaScript bundle size
   - Lazy load components

### **3.2 - Load Testing**

Test app dengan multiple concurrent users:

**Tools:**
- Artillery: https://www.artillery.io
- k6: https://k6.io
- Apache JMeter

**Basic test script (Artillery):**

```yaml
# load-test.yml
config:
  target: "https://your-app.vercel.app"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users per second
      
scenarios:
  - name: "Homepage load"
    flow:
      - get:
          url: "/"
  - name: "Submit guess"
    flow:
      - post:
          url: "/api/proxy"
          json:
            protocol: "https"
            origin: "testnet.spacetimedb.com"
            path: "/database/bitcoin-blocks/call/submitGuess"
            method: "POST"
```

Run:
```bash
npx artillery run load-test.yml
```

**Expected results:**
- 95% requests < 2 seconds
- 0% error rate
- SpacetimeDB handles concurrent writes

---

## 🛡️ Step 4: Security Audit

### **4.1 - Check Environment Variables**

Verify secrets tidak exposed:

1. Open production app

2. View page source (Ctrl+U)

3. Search for:
   - [ ] No `NEYNAR_API_KEY` visible (server-side only)
   - [ ] `NEXT_PUBLIC_*` variables OK (meant to be public)
   - [ ] No API keys di client-side code

### **4.2 - Test Admin Access Control**

1. Login sebagai non-admin user

2. Try access admin panel:
   - Manually navigate: `https://your-app.vercel.app/admin`

3. **Expected result:**
   - [ ] Admin panel tidak visible (atau access denied)
   - [ ] Reducer calls dari non-admin fail

4. Try call admin reducer directly (via console):
   ```javascript
   // Should fail
   await submitRoundResult(...)
   ```

5. **Expected result:**
   - [ ] Error: "Unauthorized" atau "Admin only"

### **4.3 - HTTPS & SSL**

1. Check URL bar: `https://` dengan lock icon

2. Click lock → Certificate

3. **Verify:**
   - [ ] Certificate issued by: Let's Encrypt atau Vercel
   - [ ] Valid until: (future date)
   - [ ] No certificate warnings

### **4.4 - CORS Headers**

1. Open DevTools → Network tab

2. Make API request

3. Check response headers:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   ```

4. **Expected result:**
   - [ ] CORS headers present
   - [ ] No CORS errors di console

---

## 📱 Step 5: Cross-Browser Testing

Test di multiple browsers dan devices:

### **Desktop:**

- [ ] **Chrome** (latest)
  - Authentication
  - Wallet connection
  - Game features
  - Chat

- [ ] **Firefox** (latest)
  - Same as Chrome tests

- [ ] **Safari** (latest)
  - Same as Chrome tests
  - Note: Safari has stricter WebSocket policies

- [ ] **Edge** (latest)
  - Same as Chrome tests

### **Mobile:**

- [ ] **iOS Safari**
  - Responsive design
  - Touch interactions
  - Deep links (Warpcast, wallets)

- [ ] **Android Chrome**
  - Same as iOS tests

- [ ] **Warpcast In-App Browser**
  - Mini app context
  - Farcaster SDK integration
  - Auto-login

---

## 🚨 Step 6: Error Handling & Edge Cases

### **Test Error Scenarios:**

#### **1. Network Disconnection**

1. Connect to app

2. Disable internet (or throttle to "Offline" di DevTools)

3. Try submit guess

4. **Expected result:**
   - [ ] Error message: "Connection lost. Retrying..."
   - [ ] Auto-reconnect when online

5. Re-enable internet

6. **Expected result:**
   - [ ] SpacetimeDB reconnects
   - [ ] Data syncs automatically
   - [ ] Console log: "Reconnected to SpacetimeDB"

#### **2. SpacetimeDB Downtime**

Simulate by using invalid DB name:

```bash
# Temporarily change env var
NEXT_PUBLIC_SPACETIME_DB_NAME=invalid-db-name
```

**Expected result:**
- [ ] Error message: "Unable to connect to game server"
- [ ] Helpful message for user
- [ ] No app crash

#### **3. Invalid Inputs**

1. Try submit guess with invalid values:
   - Empty input
   - Negative number
   - Very large number (> 1 million)

2. **Expected result:**
   - [ ] Client-side validation prevents submit
   - [ ] Error messages displayed
   - [ ] No server call made

#### **4. Duplicate Actions**

1. Submit guess

2. Quickly click submit again before response

3. **Expected result:**
   - [ ] Button disabled during submission
   - [ ] Duplicate prevention
   - [ ] No double-submit to SpacetimeDB

---

## 📊 Step 7: Monitoring Setup

### **7.1 - Enable Vercel Analytics**

Already installed, verify working:

1. Vercel Dashboard → bitcoin-blocks → Analytics

2. **Check metrics visible:**
   - Page views
   - Unique visitors
   - Top pages
   - Devices
   - Countries

### **7.2 - SpacetimeDB Monitoring**

```bash
# Monitor logs
spacetime logs bitcoin-blocks --follow

# Check metrics
spacetime metrics bitcoin-blocks
```

**Key metrics:**
- Connections: Should match concurrent users
- Requests/sec: Track peak loads
- Storage used: Monitor growth
- Error rate: Should be < 0.1%

### **7.3 - Setup Alerts (Optional)**

**Vercel:**
- Deployment notifications via email
- Error alerts via Slack integration

**SpacetimeDB:**
- Monitor logs for errors
- Alert on connection drops

**Custom monitoring:**
```javascript
// src/lib/monitoring.ts
export function logError(error: Error, context: any) {
  console.error('App Error:', error, context);
  
  // Send to monitoring service
  // e.g., Sentry, LogRocket, etc.
}
```

---

## 🎉 Step 8: Production Launch Checklist

### **Pre-Launch:**

- [ ] All tests passing
- [ ] Performance scores acceptable
- [ ] Security audit complete
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness checked
- [ ] Error handling robust
- [ ] Monitoring enabled

### **Launch Day:**

- [ ] Final deployment to production
- [ ] Verify all environment variables
- [ ] Test authentication flows
- [ ] Create first official round (admin)
- [ ] Announce to users

### **Post-Launch:**

- [ ] Monitor analytics (first 24 hours)
- [ ] Watch for errors in logs
- [ ] Gather user feedback
- [ ] Plan iterations based on feedback

---

## 🐛 Common Issues & Solutions

### **Issue: "SpacetimeDB connection timeout"**

**Causes:**
- Invalid DB name
- Network firewall
- SpacetimeDB downtime

**Solutions:**
1. Verify `NEXT_PUBLIC_SPACETIME_DB_NAME` correct
2. Check SpacetimeDB status: https://status.spacetimedb.com
3. Test connection: `spacetime describe bitcoin-blocks`
4. Check Vercel logs for WebSocket errors

### **Issue: "Neynar QR code not showing"**

**Causes:**
- Invalid Client ID
- CORS issues
- Network blocked

**Solutions:**
1. Verify `NEXT_PUBLIC_NEYNAR_CLIENT_ID` set
2. Check browser console for errors
3. Test Neynar API: `curl https://api.neynar.com/v2/healthcheck`
4. Verify redirect URIs whitelisted

### **Issue: "Wallet connection fails"**

**Causes:**
- Invalid Project ID
- Domain not whitelisted
- Wallet extension issues

**Solutions:**
1. Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
2. Add domain to WalletConnect dashboard
3. Clear browser cache
4. Try different wallet
5. Check WalletConnect status

### **Issue: "Real-time updates not working"**

**Causes:**
- WebSocket blocked
- Firewall/proxy issues
- Subscription not setup

**Solutions:**
1. Check browser console for WebSocket errors
2. Verify GameContext subscriptions active
3. Test with different network
4. Check SpacetimeDB logs

---

## 📚 Support Resources

### **If You Get Stuck:**

1. **Check documentation:**
   - [Neynar Docs](https://docs.neynar.com)
   - [WalletConnect Docs](https://docs.walletconnect.com)
   - [SpacetimeDB Docs](https://docs.spacetimedb.com)
   - [Vercel Docs](https://vercel.com/docs)

2. **Join communities:**
   - Neynar Discord: https://discord.gg/neynar
   - WalletConnect Discord: https://discord.gg/walletconnect
   - SpacetimeDB Discord: https://discord.gg/spacetimedb
   - Vercel Discord: https://discord.gg/vercel

3. **Check status pages:**
   - Neynar: https://status.neynar.com
   - WalletConnect: https://status.walletconnect.com
   - SpacetimeDB: https://status.spacetimedb.com
   - Vercel: https://vercel-status.com

---

## ✅ Final Launch Checklist

Print this and check off as you complete:

### **Technical:**
- [ ] All environment variables set correctly
- [ ] SpacetimeDB module published to maincloud
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid
- [ ] CORS headers correct

### **Authentication:**
- [ ] Neynar OAuth working (QR code scan)
- [ ] WalletConnect integration working
- [ ] Farcaster SDK auto-login working
- [ ] Admin access control verified

### **Features:**
- [ ] Create round working
- [ ] Submit guess working
- [ ] Update result working
- [ ] Daily check-in working
- [ ] Global chat working
- [ ] Leaderboards updating

### **Performance:**
- [ ] Page load < 3 seconds
- [ ] Lighthouse score > 80
- [ ] Real-time sync < 1 second latency
- [ ] Mobile responsive

### **Monitoring:**
- [ ] Vercel analytics enabled
- [ ] SpacetimeDB logs monitored
- [ ] Error tracking setup
- [ ] Alerts configured

### **User Experience:**
- [ ] Clear error messages
- [ ] Loading states visible
- [ ] Success confirmations
- [ ] Help documentation available

---

## 🎊 Congratulations!

Anda telah berhasil men-deploy **Bitcoin Blocks** production-ready app dengan:
- ✅ Dual authentication (Neynar + Wallet)
- ✅ Real-time game mechanics
- ✅ Daily check-in system
- ✅ Global chat
- ✅ Onchain integration (Base + Arbitrum)
- ✅ Admin panel

**Your app is now LIVE!** 🚀

Share dengan community dan start accepting predictions! 🎲
