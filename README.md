# Web3 Subscription dApp

A full-stack Web3 subscription platform that allows users to subscribe to premium content and receive NFT tokens as proof of membership. Built with Next.js, Solidity, and deployed on Sepolia testnet.

## 🚀 Features

- **NFT-based Subscriptions**: Users receive unique NFT tokens when subscribing
- **USDC Payments**: Secure payments using USDC token on Sepolia testnet
- **Auto-renewal**: Optional automatic subscription renewal
- **Pro-rated Refunds**: Cancel anytime with pro-rated refunds
- **Real-time Status**: Track subscription status and expiry dates
- **Modern UI**: Beautiful, responsive interface with dark mode support

## 🏗️ Architecture

### Frontend (Next.js + Wagmi)
- **Framework**: Next.js 14 with TypeScript
- **Web3**: Wagmi + Viem for Ethereum interactions
- **UI**: Radix UI components with Tailwind CSS
- **State**: React Query for server state management

### Backend (Express.js)
- **API**: RESTful Express.js server
- **Blockchain**: Ethers.js for contract interactions
- **CORS**: Configured for frontend communication

### Smart Contracts (Solidity)
- **SubscriptionManager**: Main contract managing subscriptions and NFTs
- **USDC**: Mock USDC token for testing on Sepolia
- **Security**: OpenZeppelin contracts for security best practices

## 📋 Prerequisites

- Node.js 16+ and npm/pnpm
- Git
- Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Infura/Alchemy account for RPC endpoint

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd web3-subscription-app

# Install all dependencies
npm run setup
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
nano .env
```

Required environment variables:
```env
# Get from Infura/Alchemy
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Your test wallet private key (NEVER use mainnet keys!)
PRIVATE_KEY=your_test_wallet_private_key

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

After deployment, update your `.env` file with the contract addresses:
```env
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT=0x...
NEXT_PUBLIC_USDC_CONTRACT=0x...
SUBSCRIPTION_CONTRACT_ADDRESS=0x...
USDC_CONTRACT_ADDRESS=0x...
```

### 4. Start the Application

```bash
# Terminal 1: Start backend server
npm run backend:dev

# Terminal 2: Start frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🎯 Usage Guide

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Get Test USDC**: Use the faucet function to get test USDC tokens
3. **Browse Plans**: View available subscription plans
4. **Subscribe**: Choose a plan and subscribe to receive an NFT
5. **Manage**: View, renew, or cancel your subscriptions

### For Developers

#### API Endpoints

```bash
# Health check
GET /api/health

# Get subscription plans
GET /api/plans

# Get user subscriptions
GET /api/subscriptions/:userAddress

# Get subscription details
GET /api/subscription/:tokenId

# Get USDC balance
GET /api/balance/usdc/:userAddress

# Get USDC allowance
GET /api/allowance/usdc/:userAddress

# Create subscription (backend transaction)
POST /api/subscribe

# Renew subscription
POST /api/renew

# Cancel subscription
POST /api/cancel

# Approve USDC spending
POST /api/approve/usdc
```

#### Smart Contract Functions

```solidity
// Subscribe to a plan
function subscribe(uint256 planId, uint256 duration) external payable

// Renew subscription
function renewSubscription(uint256 tokenId) external payable

// Cancel subscription
function cancelSubscription(uint256 tokenId) external

// Get available plans
function getAvailablePlans() external view returns (SubscriptionPlan[] memory)

// Get user subscriptions
function getUserSubscriptions(address user) external view returns (uint256[] memory)
```

## 🔧 Development Commands

```bash
# Frontend development
npm run dev                 # Start Next.js dev server
npm run build              # Build for production
npm run start              # Start production server

# Backend development
npm run backend:dev        # Start backend with nodemon
npm run backend:start      # Start backend server
npm run backend:install    # Install backend dependencies

# Smart contracts
npm run compile            # Compile contracts
npm run deploy:sepolia     # Deploy to Sepolia
npm run deploy:local       # Deploy to local network
npm run test               # Run contract tests
npm run node               # Start local Hardhat node
npm run clean              # Clean artifacts

# Utilities
npm run setup              # Full setup (install all deps + compile)
npm run verify             # Verify contracts on Etherscan
```

## 🧪 Testing

### Smart Contract Testing
```bash
npm run test
```

### Frontend Testing
```bash
# Connect to Sepolia testnet
# Use test wallet with Sepolia ETH
# Test subscription flow end-to-end
```

## 📁 Project Structure

```
web3-subscription-app/
├── app/                    # Next.js app directory
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── contracts/              # Solidity contracts
│   ├── SubscriptionManager.sol
│   └── USDC.sol
├── scripts/                # Deployment scripts
│   └── deploy.js
├── backend/                # Express.js backend
│   ├── server.js
│   └── package.json
├── artifacts/              # Compiled contracts (generated)
├── hardhat.config.js       # Hardhat configuration
├── package.json            # Root package.json
└── README.md
```

## 🔒 Security Considerations

- **Testnet Only**: This is designed for Sepolia testnet only
- **Private Keys**: Never use mainnet private keys
- **Environment Variables**: Keep `.env` file secure and never commit it
- **Smart Contracts**: Contracts use OpenZeppelin for security best practices

## 🚨 Important Notes

1. **Testnet ETH**: You need Sepolia ETH to deploy contracts and pay gas fees
2. **USDC Faucet**: The USDC contract includes a faucet function for testing
3. **Contract Verification**: Use `npm run verify` to verify contracts on Etherscan
4. **Gas Optimization**: Contracts are optimized for hackathon speed, not production gas efficiency

