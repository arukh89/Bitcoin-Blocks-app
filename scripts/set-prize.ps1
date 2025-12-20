# Set Prize Script for Bitcoin Blocks
# Usage: .\set-prize.ps1 -RoundId "uuid-here" -WinnerAddress "0x..." -Amount 1000

param(
    [Parameter(Mandatory=$true)]
    [string]$RoundId,
    
    [Parameter(Mandatory=$true)]
    [string]$WinnerAddress,
    
    [Parameter(Mandatory=$true)]
    [int]$Amount
)

$env:Path += ";$env:USERPROFILE\.foundry\bin"
$env:DEPLOYER_PRIVATE_KEY = "0x122b2ae8443c158cb1219935bdaa953c91ee3e98fd9a1067df8b67c6e789b185"

# Convert UUID to bytes32 (remove dashes and pad)
$cleanId = $RoundId -replace "-", ""
$roundIdBytes32 = "0x" + $cleanId.PadRight(64, '0')

# Amount in wei (18 decimals)
$amountWei = [bigint]$Amount * [bigint]::Pow(10, 18)

Write-Host "Setting prize..."
Write-Host "Round ID: $roundIdBytes32"
Write-Host "Winner: $WinnerAddress"
Write-Host "Amount: $Amount tSECOND"

# Use cast to call setPrize
$claimContract = "0x14001074CF45197B6553f702b83f4b2c32B47F3E"

cast send $claimContract "setPrize(bytes32,address,uint256)" $roundIdBytes32 $WinnerAddress $amountWei --rpc-url https://sepolia.base.org --private-key $env:DEPLOYER_PRIVATE_KEY

Write-Host "Done!"
