// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BitcoinBlocksClaim.sol";

contract SetPrizeScript is Script {
    function run() external {
        // Get environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address claimContract = vm.envAddress("CLAIM_CONTRACT");
        bytes32 roundId = vm.envBytes32("ROUND_ID");
        address winner = vm.envAddress("WINNER_ADDRESS");
        uint256 amount = vm.envUint("PRIZE_AMOUNT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        BitcoinBlocksClaim claim = BitcoinBlocksClaim(claimContract);
        claim.setPrize(roundId, winner, amount);
        
        console.log("Prize set for round:", vm.toString(roundId));
        console.log("Winner:", winner);
        console.log("Amount:", amount);
        
        vm.stopBroadcast();
    }
}
