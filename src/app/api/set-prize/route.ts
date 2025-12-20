import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { CLAIM_CONTRACT_ABI, ACTIVE_CONFIG, roundIdToBytes32 } from '@/config/contracts';

/**
 * API Route to set prize in smart contract after round finishes
 * Called automatically by finalizeRound in GameContext
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, winnerAddress, prizeAmount, secondPlaceAddress, secondPrizeAmount } = body;

    // Validate required fields
    if (!roundId || !winnerAddress || !prizeAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: roundId, winnerAddress, prizeAmount' },
        { status: 400 }
      );
    }

    // Get private key from environment (server-side only)
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[SetPrize] DEPLOYER_PRIVATE_KEY not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create wallet client
    const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(ACTIVE_CONFIG.rpcUrl),
    });

    const roundIdBytes32 = roundIdToBytes32(roundId);
    const prizeAmountWei = parseUnits(String(prizeAmount), 18);

    console.log('[SetPrize] Setting prize for round:', roundId);
    console.log('[SetPrize] Winner:', winnerAddress, 'Amount:', prizeAmount);

    // Set prize for winner
    const hash1 = await walletClient.writeContract({
      address: ACTIVE_CONFIG.claimContract as `0x${string}`,
      abi: CLAIM_CONTRACT_ABI,
      functionName: 'setPrize',
      args: [roundIdBytes32, winnerAddress as `0x${string}`, prizeAmountWei],
    });

    console.log('[SetPrize] Winner prize tx:', hash1);

    // Set prize for second place if exists
    let hash2 = null;
    if (secondPlaceAddress && secondPrizeAmount) {
      const secondPrizeWei = parseUnits(String(secondPrizeAmount), 18);
      
      hash2 = await walletClient.writeContract({
        address: ACTIVE_CONFIG.claimContract as `0x${string}`,
        abi: CLAIM_CONTRACT_ABI,
        functionName: 'setPrize',
        args: [roundIdBytes32, secondPlaceAddress as `0x${string}`, secondPrizeWei],
      });

      console.log('[SetPrize] Second place prize tx:', hash2);
    }

    return NextResponse.json({
      success: true,
      winnerTx: hash1,
      secondPlaceTx: hash2,
    });
  } catch (error: any) {
    console.error('[SetPrize] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set prize' },
      { status: 500 }
    );
  }
}
