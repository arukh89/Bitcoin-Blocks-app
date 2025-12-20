// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FundContractScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address tokenAddress = 0x4042066D7C572Fc3c39278A55860356ad9D9dEad;
        address claimContract = 0x14001074CF45197B6553f702b83f4b2c32B47F3E;
        uint256 amount = 100_000 * 10**18; // 100,000 tokens
        
        vm.startBroadcast(deployerPrivateKey);
        
        IERC20 token = IERC20(tokenAddress);
        token.transfer(claimContract, amount);
        
        console.log("Funded claim contract with:", amount / 10**18, "tokens");
        console.log("Contract balance:", token.balanceOf(claimContract) / 10**18);
        
        vm.stopBroadcast();
    }
}
