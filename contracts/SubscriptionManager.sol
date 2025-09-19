// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SubscriptionManager is ERC721, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    Counters.Counter private _tokenIdCounter;

    
    struct SubscriptionPlan {
        uint256 id;
        string name;
        uint256 price; 
        string description;
        address creator;
        bool isActive;
    }

    
    struct SubscriptionDetails {
        uint256 planId;
        uint256 expiryDate;
        bool isActive;
        bool autoRenewal;
    }

    
    IERC20 public usdcToken;
    mapping(uint256 => SubscriptionPlan) public subscriptionPlans;
    mapping(uint256 => SubscriptionDetails) public subscriptions; 
    mapping(address => uint256[]) public userSubscriptions; 
    mapping(uint256 => uint256[]) public planSubscribers; 
    
    uint256 public nextPlanId = 1;
    uint256 public constant DEFAULT_DURATION = 30 days;
    
    
    event PlanCreated(uint256 indexed planId, string name, uint256 price, address creator);
    event SubscriptionCreated(uint256 indexed tokenId, uint256 indexed planId, address indexed user, uint256 expiryDate);
    event SubscriptionRenewed(uint256 indexed tokenId, uint256 newExpiryDate);
    event SubscriptionCancelled(uint256 indexed tokenId, address indexed user);
    event AutoRenewalToggled(uint256 indexed tokenId, bool enabled);

    constructor(address _usdcToken) ERC721("SubNFT", "SUBNFT") {
        usdcToken = IERC20(_usdcToken);
        
        // Create some default plans for demo
        _createPlan("DeFi Analytics Pro", 29990000, "Advanced DeFi analytics and portfolio tracking", msg.sender);
        _createPlan("Web3 Gaming Hub", 19990000, "Premium gaming features and exclusive NFT drops", msg.sender);
        _createPlan("NFT Marketplace Plus", 39990000, "Advanced NFT trading tools and market insights", msg.sender);
    }

    // Create a new subscription plan (only owner)
    function createPlan(
        string memory _name,
        uint256 _price,
        string memory _description
    ) external onlyOwner {
        _createPlan(_name, _price, _description, msg.sender);
    }

    function _createPlan(
        string memory _name,
        uint256 _price,
        string memory _description,
        address _creator
    ) internal {
        uint256 planId = nextPlanId++;
        subscriptionPlans[planId] = SubscriptionPlan({
            id: planId,
            name: _name,
            price: _price,
            description: _description,
            creator: _creator,
            isActive: true
        });
        
        emit PlanCreated(planId, _name, _price, _creator);
    }

    // Subscribe to a plan and mint NFT
    function subscribe(
        uint256 _planId,
        uint256 _duration
    ) external nonReentrant whenNotPaused {
        require(subscriptionPlans[_planId].isActive, "Plan not active");
        require(_duration > 0, "Invalid duration");
        
        SubscriptionPlan memory plan = subscriptionPlans[_planId];
        
        // Transfer USDC payment
        usdcToken.safeTransferFrom(msg.sender, address(this), plan.price);
        
        // Mint NFT
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        
        // Set subscription details
        uint256 expiryDate = block.timestamp + _duration;
        subscriptions[tokenId] = SubscriptionDetails({
            planId: _planId,
            expiryDate: expiryDate,
            isActive: true,
            autoRenewal: false
        });
        
        // Update mappings
        userSubscriptions[msg.sender].push(tokenId);
        planSubscribers[_planId].push(tokenId);
        
        emit SubscriptionCreated(tokenId, _planId, msg.sender, expiryDate);
    }

    // Renew an existing subscription
    function renewSubscription(uint256 _tokenId) external nonReentrant whenNotPaused {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        
        SubscriptionDetails storage subscription = subscriptions[_tokenId];
        require(subscription.isActive, "Subscription not active");
        
        SubscriptionPlan memory plan = subscriptionPlans[subscription.planId];
        
        // Transfer USDC payment
        usdcToken.safeTransferFrom(msg.sender, address(this), plan.price);
        
        // Extend subscription
        subscription.expiryDate += DEFAULT_DURATION;
        
        emit SubscriptionRenewed(_tokenId, subscription.expiryDate);
    }

    // Cancel subscription and burn NFT
    function cancelSubscription(uint256 _tokenId) external nonReentrant {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        
        SubscriptionDetails storage subscription = subscriptions[_tokenId];
        require(subscription.isActive, "Subscription not active");
        
        // Calculate refund (pro-rated)
        uint256 timeRemaining = subscription.expiryDate > block.timestamp 
            ? subscription.expiryDate - block.timestamp 
            : 0;
        
        if (timeRemaining > 0) {
            SubscriptionPlan memory plan = subscriptionPlans[subscription.planId];
            uint256 refundAmount = (plan.price * timeRemaining) / DEFAULT_DURATION;
            
            if (refundAmount > 0) {
                usdcToken.safeTransfer(msg.sender, refundAmount);
            }
        }
        
        // Deactivate subscription
        subscription.isActive = false;
        
        // Remove from user subscriptions
        _removeFromUserSubscriptions(msg.sender, _tokenId);
        
        // Burn NFT
        _burn(_tokenId);
        
        emit SubscriptionCancelled(_tokenId, msg.sender);
    }

    // Toggle auto-renewal
    function toggleAutoRenewal(uint256 _tokenId) external {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        
        subscriptions[_tokenId].autoRenewal = !subscriptions[_tokenId].autoRenewal;
        
        emit AutoRenewalToggled(_tokenId, subscriptions[_tokenId].autoRenewal);
    }

    // Auto-renewal function (can be called by anyone to process auto-renewals)
    function processAutoRenewal(uint256 _tokenId) external nonReentrant whenNotPaused {
        require(_exists(_tokenId), "Token does not exist");
        
        SubscriptionDetails storage subscription = subscriptions[_tokenId];
        require(subscription.isActive, "Subscription not active");
        require(subscription.autoRenewal, "Auto-renewal not enabled");
        require(block.timestamp >= subscription.expiryDate, "Subscription not expired");
        
        address tokenOwner = ownerOf(_tokenId);
        SubscriptionPlan memory plan = subscriptionPlans[subscription.planId];
        
        // Check if user has enough USDC balance
        require(usdcToken.balanceOf(tokenOwner) >= plan.price, "Insufficient USDC balance");
        
        // Transfer USDC payment
        usdcToken.safeTransferFrom(tokenOwner, address(this), plan.price);
        
        // Extend subscription
        subscription.expiryDate += DEFAULT_DURATION;
        
        emit SubscriptionRenewed(_tokenId, subscription.expiryDate);
    }

    // Check if subscription is expired
    function isSubscriptionExpired(uint256 _tokenId) external view returns (bool) {
        require(_exists(_tokenId), "Token does not exist");
        return block.timestamp >= subscriptions[_tokenId].expiryDate;
    }

    // View functions
    function getAvailablePlans() external view returns (SubscriptionPlan[] memory) {
        uint256 activePlans = 0;
        for (uint256 i = 1; i < nextPlanId; i++) {
            if (subscriptionPlans[i].isActive) {
                activePlans++;
            }
        }
        
        SubscriptionPlan[] memory plans = new SubscriptionPlan[](activePlans);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextPlanId; i++) {
            if (subscriptionPlans[i].isActive) {
                plans[index] = subscriptionPlans[i];
                index++;
            }
        }
        
        return plans;
    }

    function getUserSubscriptions(address _user) external view returns (uint256[] memory) {
        return userSubscriptions[_user];
    }

    function getSubscriptionDetails(uint256 _tokenId) external view returns (
        uint256 planId,
        uint256 expiryDate,
        bool isActive
    ) {
        require(_exists(_tokenId), "Token does not exist");
        SubscriptionDetails memory subscription = subscriptions[_tokenId];
        return (subscription.planId, subscription.expiryDate, subscription.isActive);
    }

    function getPlanDetails(uint256 _planId) external view returns (SubscriptionPlan memory) {
        return subscriptionPlans[_planId];
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawUSDC() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        usdcToken.safeTransfer(owner(), balance);
    }

    function updatePlanStatus(uint256 _planId, bool _isActive) external onlyOwner {
        subscriptionPlans[_planId].isActive = _isActive;
    }

    // Helper function to remove token from user subscriptions
    function _removeFromUserSubscriptions(address _user, uint256 _tokenId) internal {
        uint256[] storage userTokens = userSubscriptions[_user];
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (userTokens[i] == _tokenId) {
                userTokens[i] = userTokens[userTokens.length - 1];
                userTokens.pop();
                break;
            }
        }
    }

    // Override tokenURI to provide metadata
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Token does not exist");
        
        SubscriptionDetails memory subscription = subscriptions[_tokenId];
        SubscriptionPlan memory plan = subscriptionPlans[subscription.planId];
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(abi.encodePacked(
                '{"name":"',
                plan.name,
                ' Subscription NFT","description":"',
                plan.description,
                '","image":"https://via.placeholder.com/300x300/6366f1/ffffff?text=',
                _encodeURIComponent(plan.name),
                '","attributes":[{"trait_type":"Plan","value":"',
                plan.name,
                '"},{"trait_type":"Expiry","value":"',
                _toString(subscription.expiryDate),
                '"},{"trait_type":"Active","value":"',
                subscription.isActive ? "true" : "false",
                '"}]}'
            ))
        ));
    }

    // Helper functions for string encoding
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        
        string memory result = new string(4 * ((data.length + 2) / 3));
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let i := 0
            } lt(i, mload(data)) {
                i := add(i, 3)
            } {
                let input := and(mload(add(data, add(32, i))), 0xffffff)
                
                let out := mload(add(tablePtr, and(shr(250, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(244, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(238, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(232, input), 0x3F))), 0xFF))
                out := shl(224, out)
                
                mstore(resultPtr, out)
                
                resultPtr := add(resultPtr, 4)
            }
            
            switch mod(mload(data), 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }
        }
        
        return result;
    }

    function _encodeURIComponent(string memory str) internal pure returns (string memory) {
        bytes memory data = bytes(str);
        string memory result = new string(data.length * 3);
        bytes memory resultBytes = bytes(result);
        uint256 j = 0;
        
        for (uint256 i = 0; i < data.length; i++) {
            bytes1 b = data[i];
            if (b >= 0x30 && b <= 0x39) { // 0-9
                resultBytes[j] = b;
                j++;
            } else if (b >= 0x41 && b <= 0x5A) { // A-Z
                resultBytes[j] = b;
                j++;
            } else if (b >= 0x61 && b <= 0x7A) { // a-z
                resultBytes[j] = b;
                j++;
            } else if (b == 0x20) { // space
                resultBytes[j] = 0x2B; // +
                j++;
            } else {
                resultBytes[j] = 0x25; // %
                j++;
                resultBytes[j] = _toHexChar(uint8(b) >> 4);
                j++;
                resultBytes[j] = _toHexChar(uint8(b) & 0x0F);
                j++;
            }
        }
        
        return string(resultBytes);
    }

    function _toHexChar(uint8 b) internal pure returns (bytes1) {
        if (b < 10) {
            return bytes1(uint8(b) + 0x30);
        } else {
            return bytes1(uint8(b) + 0x37);
        }
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
