// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BitcoinBlocksClaim
 * @notice Contract for claiming $SECOND token prizes from Bitcoin Blocks game
 */
contract BitcoinBlocksClaim is Ownable, ReentrancyGuard {
    IERC20 public immutable rewardToken;
    
    struct Prize {
        uint256 amount;
        bool claimed;
    }
    
    // roundId => winner address => Prize
    mapping(bytes32 => mapping(address => Prize)) public prizes;
    
    // Track all rounds
    bytes32[] public rounds;
    
    event PrizeSet(bytes32 indexed roundId, address indexed winner, uint256 amount);
    event PrizeClaimed(bytes32 indexed roundId, address indexed winner, uint256 amount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _rewardToken) Ownable(msg.sender) {
        require(_rewardToken != address(0), "Invalid token address");
        rewardToken = IERC20(_rewardToken);
    }
    
    /**
     * @notice Set prize for a winner (admin only)
     * @param roundId Unique round identifier (can be keccak256 of round number)
     * @param winner Winner's wallet address
     * @param amount Prize amount in token units
     */
    function setPrize(
        bytes32 roundId,
        address winner,
        uint256 amount
    ) external onlyOwner {
        require(winner != address(0), "Invalid winner address");
        require(amount > 0, "Amount must be > 0");
        require(prizes[roundId][winner].amount == 0, "Prize already set");
        
        prizes[roundId][winner] = Prize({
            amount: amount,
            claimed: false
        });
        
        rounds.push(roundId);
        
        emit PrizeSet(roundId, winner, amount);
    }
    
    /**
     * @notice Set multiple prizes at once (admin only)
     */
    function setPrizeBatch(
        bytes32[] calldata roundIds,
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            roundIds.length == winners.length && winners.length == amounts.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < roundIds.length; i++) {
            require(winners[i] != address(0), "Invalid winner address");
            require(amounts[i] > 0, "Amount must be > 0");
            require(prizes[roundIds[i]][winners[i]].amount == 0, "Prize already set");
            
            prizes[roundIds[i]][winners[i]] = Prize({
                amount: amounts[i],
                claimed: false
            });
            
            rounds.push(roundIds[i]);
            
            emit PrizeSet(roundIds[i], winners[i], amounts[i]);
        }
    }
    
    /**
     * @notice Claim prize for a specific round
     * @param roundId Round identifier
     */
    function claim(bytes32 roundId) external nonReentrant {
        Prize storage prize = prizes[roundId][msg.sender];
        
        require(prize.amount > 0, "No prize for this round");
        require(!prize.claimed, "Already claimed");
        
        uint256 amount = prize.amount;
        prize.claimed = true;
        
        require(
            rewardToken.transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit PrizeClaimed(roundId, msg.sender, amount);
    }
    
    /**
     * @notice Check if user has unclaimed prize for a round
     */
    function hasPrize(bytes32 roundId, address user) external view returns (bool, uint256) {
        Prize memory prize = prizes[roundId][user];
        if (prize.amount > 0 && !prize.claimed) {
            return (true, prize.amount);
        }
        return (false, 0);
    }
    
    /**
     * @notice Get prize details
     */
    function getPrize(bytes32 roundId, address user) external view returns (uint256 amount, bool claimed) {
        Prize memory prize = prizes[roundId][user];
        return (prize.amount, prize.claimed);
    }
    
    /**
     * @notice Withdraw tokens from contract (admin only, for emergency)
     */
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(rewardToken.transfer(to, amount), "Transfer failed");
        emit TokensWithdrawn(to, amount);
    }
    
    /**
     * @notice Get contract token balance
     */
    function getBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
    
    /**
     * @notice Get total rounds count
     */
    function getRoundsCount() external view returns (uint256) {
        return rounds.length;
    }
}
