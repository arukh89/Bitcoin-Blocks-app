# Rencana: Hadiah Token “Second” Otomatis Onchain di Base untuk Bitcoin-Blocks-app

## Ringkasan Eksekutif

Tujuan: membuat hadiah token “second” (token milik pihak lain) terkirim otomatis saat ronde berakhir, dan pemenang ditentukan otomatis. Arsitektur proyek saat ini sudah memiliki alur klaim onchain via kontrak RewardClaimer (EIP‑712). Untuk otomatisasi penuh tanpa klik user, kita dapat:

- Opsi A (perubahan minimal, direkomendasikan awal): tetap gunakan perhitungan pemenang off‑chain (sesuai kode sekarang), namun lakukan distribusi onchain otomatis dengan layanan automasi (Chainlink Automation/Gelato) yang memanggil kontrak klaim segera setelah ronde “finished”. Untuk token “second”, deploy/konfigurasi instance RewardClaimer terpisah yang menunjuk ke alamat ERC‑20 pihak lain; pre‑fund kontrak tersebut. [1][2][4][6][8][9][10]
- Opsi B (kontrak distribusi multi‑token): deploy kontrak baru yang mendukung banyak token untuk tiap tipe hadiah, agar tidak perlu banyak instance. Server menandatangani payload per pemenang (EIP‑712), automasi mengeksekusi transfer. [8][9][10]
- Opsi C (sepenuhnya onchain): migrasi submit guess ke kontrak onchain + masukkan data hasil blok BTC via oracle (Chainlink Functions/Feeds), lalu kontrak menghitung pemenang dan transfer otomatis. Ini paling “trustless” namun paling kompleks dan mahal (gas + integrasi oracle). [9]

Jawaban singkat: hadiah dengan token pihak lain itu bisa, asalkan kontrak distributor/klaim memiliki saldo token atau memiliki allowance dari treasury Anda. Kita tidak butuh hak minter. [8]

## Bagaimana Proyek Saat Ini Bekerja (ringkas)

- Ronde: dibuat dengan `create_round` dan otomatis ditutup saat `end_time` lewat oleh `tick_rounds` (5 detik sekali). Admin juga bisa menutup manual. [1]
- Hasil ronde: admin menarik data block BTC dari mempool.space (API internal), lalu menghitung pemenang (tebakan terdekat, tie-break waktu submit) dan menyimpan `winning_fid`; status ronde menjadi `finished`. [4]
- Pemenang kedua/jackpot: tidak disimpan di DB; dihitung saat proses tanda-tangan klaim (server menyortir ulang semua tebakan) untuk memvalidasi bahwa pemohon memang juara 2 atau jackpot. [2][3]
- Klaim onchain: server menandatangani EIP‑712 “Claim”; user mengirim tx `claim(...)` ke kontrak RewardClaimer yang mentransfer token ke pemenang. [2][6]

Implikasi: kalkulasi pemenang berada di off‑chain (SpacetimeDB + API), sedangkan distribusi token berlangsung onchain saat `claim` dieksekusi. [1][2]

## Aturan Pemenang (disimpulkan dari kode)

- First place: tebakan dengan selisih minimum terhadap `actualTxCount`; jika seri, yang lebih awal submit menang. [4]
- Second place: entri kedua setelah sortir logika di atas. [2]
- Jackpot: pemenang pertama yang menebak tepat sama dengan `actualTxCount`. [2]

## Kapan Ronde Berakhir

- Otomatis oleh scheduler `tick_rounds` ketika `end_time` lewat. [1]
- Admin panel juga mem‑poll mempool.space; saat target block tersedia, UI menutup ronde (lock submit) dan mem‑post hasil. [4]

## “Token Second” (token pihak lain) — Apakah Mungkin?

Ya. Kontrak distributor/klaim cukup memegang saldo token ERC‑20 tersebut (atau mendapat allowance), lalu melakukan `transfer`. Anda tidak perlu menjadi deployer token itu. Pastikan token tidak punya pembatasan transfer. [8]

Catatan kontrak saat ini (RewardClaimer) dikonfigurasi untuk 1 token per instance (alamat token diset di konstruktor). Untuk membayar hadiah “second” dengan token lain, deploy instance RewardClaimer kedua yang menunjuk ke token tersebut, dan rute kan klaim “second” ke kontrak kedua. [6]

## Opsi A — Otomatisasi Tanpa Ubah Pola Perhitungan (Direkomendasikan awal)

Garis besar:

1) Instance kontrak untuk token “second”
- Deploy RewardClaimer (kedua) di Base dengan argumen: `token = <alamat token second>`, `signer = <EOA server penanda tangan>`, `chainId = 8453 (Base) / 84532 (Base Sepolia)`. Pre‑fund kontrak dengan saldo token second sesuai budget hadiah. [6][7]

2) Konfigurasi server/ENV per tipe hadiah
- Tambahkan env baru untuk “second”:
  - `REWARD_CLAIMER_SECOND_ADDRESS`
  - `REWARD_TOKEN_SECOND_ADDRESS`
- Modifikasi endpoint `POST /api/rewards/sign-claim` agar memilih `verifyingContract` dan token sesuai `rewardType`. Domain EIP‑712 harus pakai kontrak yang tepat. [2][6]

3) Otomatisasi eksekusi klaim (tanpa klik user)
- Buat job automasi (Chainlink Automation atau Gelato Web3 Functions):
  - Trigger: jadwal pendek (mis. tiap 1 menit) atau event kustom; job memeriksa “apakah ada ronde finished dengan pemenang kedua belum dieksekusi klaim”.
  - Aksi: panggil endpoint server `sign-claim` untuk `rewardType = second` guna memperoleh signature + calldata `claim(...)`, lalu kirim transaksi ke kontrak RewardClaimer (alamat “second”). [2][9][10]
- Keamanan/ketahanan: kontrak RewardClaimer melacak klaim via hash (anti double‑claim); job idempoten. [6]

4) Transparansi opsional
- Publish event onchain (kontrak ringan “RoundOracle”) yang menyimpan `roundId`, `blockHash`, `actualTxCount`, `first`, `second` untuk audit publik. Tidak wajib, tapi baik untuk akuntabilitas. 

Kelebihan Opsi A:
- Perubahan kecil pada codebase; reuse alur EIP‑712 yang sudah ada. 
- Distribusi tetap onchain + tanpa interaksi user ketika ronde selesai.

Kekurangan:
- Perhitungan pemenang tetap off‑chain (sesuai desain saat ini). 

### Contoh perubahan minimal pada server (pseudo‑diff)

```ts
// di /api/rewards/sign-claim/route.ts
const isSecond = rewardType === 'second'
const contractAddress = isSecond ? process.env.REWARD_CLAIMER_SECOND_ADDRESS : process.env.REWARD_CLAIMER_ADDRESS
const tokenAddress = isSecond ? process.env.REWARD_TOKEN_SECOND_ADDRESS    : process.env.REWARD_TOKEN_ADDRESS
// domain.verifyingContract = contractAddress
// sisanya tetap sama; signature dibuat untuk kontrak tujuan yang sesuai
```

### Contoh rangka Gelato Web3 Function (TypeScript, ringkas)

```ts
// Pseudocode: panggil API sign-claim, lalu relay tx claim ke RewardClaimer second
export default async function handler() {
  const roundId = await findFinishedRoundNeedingSecondPayout()
  if (!roundId) return
  const payload = await fetch(`${SERVER}/api/rewards/sign-claim`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ roundId, rewardType: 'second', recipient: WINNER_ADDR, amount: SECOND_AMOUNT, fid: WINNER_FID })
  }).then(r => r.json())
  // submit tx
  await sendTransaction({ to: payload.tx.to, data: payload.tx.data, chainId: payload.tx.chainId })
}
```

## Opsi B — Kontrak Distribusi Multi‑Token (opsional)

Jika ingin satu kontrak untuk banyak token hadiah: buat kontrak `MultiTokenRewardClaimer` yang memasukkan `token` ke typed data (EIP‑712) serta menyimpan anti‑replay per `(roundId, fid, prizeType, token)`. Server menandatangani payload per pemenang; automasi memanggil `claim`. Ini mengurangi kebutuhan multiple instance. [8][9]

## Opsi C — Full Onchain Winner Determination (komprehensif)

- Migrasi submit guess ke kontrak `GuessingGame` (mapping satu tebakan per address/FID). 
- Gunakan oracle untuk memasukkan `actualTxCount` blok BTC (Chainlink Functions/Automation) ke fungsi `finalizeRound`. 
- Kontrak menyimpan kandidat terdekat secara incremental agar hemat gas, lalu melakukan transfer token ke pemenang pertama/kedua saat finalisasi. [9]

Trade‑off: jauh lebih kompleks, biaya gas lebih tinggi, perlu integrasi oracle data BTC. 

## Integrasi dengan Base

- Mengapa Base: murah/cepat, tooling lengkap, ekosistem aktif. [5]
- Koneksi Jaringan: Base mainnet (`https://mainnet.base.org`), Base Sepolia (`https://sepolia.base.org`), chain id 8453/84532. [7]
- Deploy kontrak: panduan resmi menyediakan langkah dengan Foundry/Hardhat. [5][7]
- Automasi: Chainlink Automation tersedia di Base; Gelato Automated Transactions/Web3 Functions juga mendukung pattern eksekusi terjadwal/berbasis event/HTTP. [9][10]

## Checklist Implementasi (Opsi A)

1) Siapkan token “second”
- Dapatkan alamat token ERC‑20 di Base; pastikan bebas transfer.
- Transfer saldo hadiah ke alamat kontrak RewardClaimer “second”. [8]

2) Deploy kontrak klaim “second”
- Constructor: `(token, signer, chainId)` di Base/Mainnet atau Base Sepolia. [6][7]

3) Update server & env
- Tambah ENV: `REWARD_CLAIMER_SECOND_ADDRESS`, `REWARD_TOKEN_SECOND_ADDRESS`.
- Update route `sign-claim` untuk memilih kontrak/DOMAIN sesuai `rewardType`. [2]

4) Otomatisasi
- Buat task di Chainlink Automation/Gelato untuk memicu eksekusi klaim pemenang kedua.
- Idempoten: biarkan kontrak menolak klaim ganda. [6][9][10]

5) Uji di Base Sepolia lebih dulu
- Gunakan RPC `https://sepolia.base.org`, faucet test ETH, verifikasi flow end‑to‑end. [7]

## Catatan Teknis Penting

- Desimal token: endpoint saat ini menganggap `amount` sudah dalam satuan terkecil. Sesuaikan agar benar terhadap `decimals()` token “second”. [2][8]
- Anti double‑claim: RewardClaimer melacak hash klaim; aman untuk automasi idempoten. [6]
- Kepemilikan kunci penanda tangan: amankan PK server; rotasi via `setSigner(...)` jika perlu. [6]

## Lampiran: Algoritma Penentuan Pemenang (sesuai kode sekarang)

- Urutkan semua tebakan untuk `roundId` naik berdasarkan `|guess - actualTxCount|`; jika sama, berdasarkan `submittedAt` lebih kecil. 
- Ambil indeks 0 sebagai first, indeks 1 sebagai second. [2][4]

## Kesimpulan & Rekomendasi

Mulai dengan Opsi A: deploy RewardClaimer khusus token “second”, ubah endpoint tanda tangan supaya `rewardType=second` diverifikasi di kontrak kedua, dan tambahkan automasi untuk mengirim transaksi klaim segera setelah ronde “finished”. Ini mencapai: hadiah dikirim otomatis, onchain, menggunakan token pihak lain, tanpa migrasi besar. Setelah stabil, pertimbangkan Opsi B atau C bila Anda butuh satu kontrak multi‑token atau determinasi pemenang sepenuhnya onchain.

---

## Sumber

Internal codebase:
1. spacetime-server/src/lib.rs — tabel & reducer ronde, scheduler `tick_rounds`, `update_round_result`. 
2. src/app/api/rewards/sign-claim/route.ts — tanda tangan EIP‑712 klaim, validasi juara 2/jackpot.
3. src/components/ClaimRewards.tsx — UI klaim & integrasi API klaim.
4. src/components/AdminPanel.tsx — logika posting hasil & pemilihan pemenang.
5. Base Docs — “Why Base?” https://docs.base.org/base-chain/quickstart/why-base
6. RewardClaimer ABI (single‑token, EIP‑712 claim) — src/lib/abis/rewardClaimer.ts

Eksternal:
7. Base — Deploy/Network info (Base Sepolia, RPC, chain id 84532; Base mainnet):
   - Connecting/Deploy on Base: https://docs.base.org/base-chain/quickstart/connecting-to-base , https://docs.base.org/base-chain/quickstart/deploy-on-base ,
   - Deployment to Base Sepolia (menyebut 84532): https://docs.base.org/learn/deployment-to-testnet/deployment-to-base-sepolia-sbs
8. OpenZeppelin ERC‑20 (approve/allowance/transferFrom): https://docs.openzeppelin.com/contracts/5.x/api/token/ERC20
9. Chainlink Automation (umum) + artikel Base support: https://automation.chain.link/ , https://chainlinktoday.com/base-adds-automation-to-its-expanding-suite-of-chainlink-integrations/
10. Gelato Automated Transactions/Web3 Functions: https://docs.gelato.network/Web3-Functions/Introduction/Automated-transactions , https://docs.gelato.network/Web3-Functions/How-To-Guides/Initiate-an-automated-transactions
