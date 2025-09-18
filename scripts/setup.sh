#!/bin/bash

echo "🚀 Web3 Subscription dApp Setup Script"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Compile contracts
echo ""
echo "🔨 Compiling smart contracts..."
npx hardhat compile

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env with your configuration:"
    echo "   - RPC_URL: Your Sepolia RPC endpoint"
    echo "   - PRIVATE_KEY: Your test wallet private key"
    echo "   - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: Your WalletConnect project ID"
else
    echo "✅ .env file already exists"
fi

# Check environment variables
echo ""
echo "🔍 Checking environment configuration..."

if grep -q "YOUR_INFURA_KEY" .env; then
    echo "⚠️  Please update RPC_URL in .env with your Infura/Alchemy key"
fi

if grep -q "your_test_wallet_private_key" .env; then
    echo "⚠️  Please update PRIVATE_KEY in .env with your test wallet private key"
fi

if grep -q "0x..." .env; then
    echo "⚠️  Please update contract addresses in .env after deployment"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Deploy contracts: npm run deploy:sepolia"
echo "3. Update .env with deployed contract addresses"
echo "4. Start backend: npm run backend:dev"
echo "5. Start frontend: npm run dev"
echo ""
echo "📚 For detailed instructions, see README.md"
echo "🔗 For frontend integration, see FRONTEND_INTEGRATION.md"
