// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BitcoinBlocksClaim.sol";

contract DeployScript is Script {
    function run() external {
        // Get token address from environment or use default
        // Base Mainnet $SECOND token: 0xCE9199A0C05446ceEd4F0F928c864b7a2f9F86B3
        // Base Sepolia test token: 0x4042066D7C572Fc3c39278A55860356ad9D9dEad
        address tokenAddress = vm.envOr("TOKEN_ADDRESS", address(0xCE9199A0C05446ceEd4F0F928c864b7a2f9F86B3));
        
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        BitcoinBlocksClaim claimContract = new BitcoinBlocksClaim(tokenAddress);
        
        console.log("BitcoinBlocksClaim deployed to:", address(claimContract));
        console.log("Reward token:", tokenAddress);
        
        vm.stopBroadcast();
    }
}
