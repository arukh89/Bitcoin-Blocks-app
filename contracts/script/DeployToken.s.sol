// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TestSecondToken.sol";

contract DeployTokenScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        TestSecondToken token = new TestSecondToken();
        
        console.log("TestSecondToken deployed to:", address(token));
        console.log("Initial supply: 1,000,000 tSECOND");
        
        vm.stopBroadcast();
    }
}
