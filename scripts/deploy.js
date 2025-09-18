const { ethers } = require("hardhat");
const fs = require("fs");

(async () => {
  try {
    console.log("🚀 Starting deployment to Sepolia testnet...\n");

    const [deployer] = await ethers.getSigners();
    const provider = ethers.provider;
    const balance = await provider.getBalance(deployer.address);

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    console.log("📄 Deploying USDC token...");
    const USDC = await ethers.getContractFactory("USDC");
    const usdc = await USDC.deploy();
    await usdc.waitForDeployment();
    console.log("✅ USDC deployed to:", await usdc.getAddress());

    console.log("\n📄 Deploying SubscriptionManager...");
    const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
    const subscriptionManager = await SubscriptionManager.deploy(await usdc.getAddress());
    await subscriptionManager.waitForDeployment();
    console.log("✅ SubscriptionManager deployed to:", await subscriptionManager.getAddress());

    console.log("\n🔍 Verifying deployments...");
    const usdcName = await usdc.name();
    const usdcSymbol = await usdc.symbol();
    const usdcDecimals = await usdc.decimals();
    console.log(`USDC Token: ${usdcName} (${usdcSymbol}) - ${usdcDecimals} decimals`);

    const nftName = await subscriptionManager.name();
    const nftSymbol = await subscriptionManager.symbol();
    console.log(`NFT Contract: ${nftName} (${nftSymbol})`);

    const plans = await subscriptionManager.getAvailablePlans();
    console.log(`\n📋 Available subscription plans: ${plans.length}`);
    for (let i = 0; i < plans.length; i++) {
      console.log(`${i + 1}. ${plans[i].name} - $${ethers.formatUnits(plans[i].price, 6)} USDC`);
    }

    const envContent = `# Contract Addresses (Sepolia Testnet)
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT=${await subscriptionManager.getAddress()}
NEXT_PUBLIC_USDC_CONTRACT=${await usdc.getAddress()}

# Backend Configuration
RPC_URL=${process.env.RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"}
PRIVATE_KEY=${process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY"}
BACKEND_PORT=5000

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "c4f79cc821944d9680842e34466bfbd"}

# Etherscan (optional)
ETHERSCAN_API_KEY=${process.env.ETHERSCAN_API_KEY || ""}
`;

    console.log("\n📝 Environment variables for your .env file:");
    console.log("=".repeat(60));
    console.log(envContent);
    console.log("=".repeat(60));

    const deploymentInfo = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        USDC: {
          address: await usdc.getAddress(),
          name: usdcName,
          symbol: usdcSymbol,
          decimals: usdcDecimals.toString()
        },
        SubscriptionManager: {
          address: await subscriptionManager.getAddress(),
          name: nftName,
          symbol: nftSymbol
        }
      },
      plans: plans.map(plan => ({
        id: plan.id.toString(),
        name: plan.name,
        price: plan.price.toString(),
        description: plan.description,
        creator: plan.creator
      }))
    };

    fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to deployment-info.json");
    console.log("\n🎉 Deployment completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
})();
