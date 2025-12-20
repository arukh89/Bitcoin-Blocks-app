// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestSecondToken
 * @notice Test token for Bitcoin Blocks game on Base Sepolia
 */
contract TestSecondToken is ERC20, Ownable {
    constructor() ERC20("Test SECOND", "tSECOND") Ownable(msg.sender) {
        // Mint 1,000,000 tokens to deployer (18 decimals)
        _mint(msg.sender, 1_000_000 * 10**18);
    }
    
    /**
     * @notice Mint more tokens (owner only)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
