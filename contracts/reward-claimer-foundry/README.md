# RewardClaimer (Foundry) — Base Sepolia/Mainnet

Kontrak klaim token berbasis EIP‑712 yang cocok dengan ABI app. Domain:
- name: `RewardClaimer`
- version: `1`
- chainId: sesuai argumen konstruktor
- verifyingContract: alamat kontrak ini

## Struktur
- `foundry.toml`
- `src/RewardClaimer.sol`

## Prasyarat
Instal Foundry (disarankan WSL/Git Bash):

```
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Import wallet deployer (lokal, aman):

```
cast wallet import deployer --interactive
```

## Build

```
forge build
```

## Deploy — Base Sepolia (84532)

```
export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
forge create ./src/RewardClaimer.sol:RewardClaimer \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer \
  --constructor-args <TOKEN> <SIGNER_EOA> 84532 \
  --broadcast
```

## Deploy — Base Mainnet (8453)

```
export BASE_RPC_URL="https://mainnet.base.org"
forge create ./src/RewardClaimer.sol:RewardClaimer \
  --rpc-url $BASE_RPC_URL \
  --account deployer \
  --constructor-args <TOKEN> <SIGNER_EOA> 8453 \
  --broadcast
```

Setelah deploy, prefund token ke alamat kontrak ini sesuai kebutuhan hadiah.
