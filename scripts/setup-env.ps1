# Bitcoin Blocks App - Environment Setup Script
# Run this script to generate secure secrets

Write-Host "🔐 Bitcoin Blocks App - Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to overwrite it? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
}

# Copy example file
Copy-Item ".env.example" ".env.local" -Force
Write-Host "✅ Created .env.local from .env.example" -ForegroundColor Green

# Generate CRON_SECRET
$cronSecret = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
(Get-Content ".env.local") -replace "^CRON_SECRET=.*$", "CRON_SECRET=$cronSecret" | Set-Content ".env.local"
Write-Host "✅ Generated CRON_SECRET" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Fill in the remaining values in .env.local"
Write-Host "2. Get Supabase credentials from your project dashboard"
Write-Host "3. Get Neynar API key from https://neynar.com"
Write-Host "4. Generate a new wallet for REWARD_SIGNER_PRIVATE_KEY"
Write-Host "5. Set the signer address in your RewardClaimer contract"
Write-Host ""
Write-Host "⚠️  NEVER commit .env.local to git!" -ForegroundColor Red
Write-Host ""
