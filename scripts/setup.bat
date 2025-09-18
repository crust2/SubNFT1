@echo off
echo 🚀 Web3 Subscription dApp Setup Script
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)

echo ✅ npm version: 
npm --version

REM Install root dependencies
echo.
echo 📦 Installing root dependencies...
npm install

REM Install backend dependencies
echo.
echo 📦 Installing backend dependencies...
cd backend
npm install
cd ..

REM Compile contracts
echo.
echo 🔨 Compiling smart contracts...
npx hardhat compile

REM Check if .env exists
if not exist ".env" (
    echo.
    echo ⚠️  .env file not found. Creating from template...
    copy env.example .env
    echo ✅ Created .env file from template
    echo 📝 Please edit .env with your configuration:
    echo    - RPC_URL: Your Sepolia RPC endpoint
    echo    - PRIVATE_KEY: Your test wallet private key
    echo    - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: Your WalletConnect project ID
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your configuration
echo 2. Deploy contracts: npm run deploy:sepolia
echo 3. Update .env with deployed contract addresses
echo 4. Start backend: npm run backend:dev
echo 5. Start frontend: npm run dev
echo.
echo 📚 For detailed instructions, see README.md
echo 🔗 For frontend integration, see FRONTEND_INTEGRATION.md
echo.
pause
