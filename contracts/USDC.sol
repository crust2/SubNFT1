// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title USDC Token for Sepolia Testnet
 * @dev Mock USDC token for testing purposes
 * This is NOT the real USDC token - only for demo/testing on testnets
 */
contract USDC is ERC20, Ownable, Pausable {
    uint8 private constant _decimals = 6;
    
    constructor() ERC20("USD Coin", "USDC") {
        // Mint initial supply for testing (1,000,000 USDC)
        _mint(msg.sender, 1000000 * 10**_decimals);
    }
    
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }
    
    // Mint function for testing purposes
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    // Function to allow users to get test USDC (for demo purposes)
    function faucet() external {
        require(balanceOf(msg.sender) == 0, "Already claimed faucet");
        _mint(msg.sender, 1000 * 10**_decimals); // 1000 USDC
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
