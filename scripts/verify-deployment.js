const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Verifying deployment...\n");

  // Load deployment info
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
  } catch (error) {
    console.error("❌ No deployment-info.json found. Please deploy contracts first.");
    process.exit(1);
  }

  const { contracts } = deploymentInfo;
  
  // Initialize provider
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  
  // Verify USDC contract
  console.log("📄 Verifying USDC contract...");
  try {
    const usdcContract = new ethers.Contract(
      contracts.USDC.address,
      ["function name() view returns (string)", "function symbol() view returns (string)", "function decimals() view returns (uint8)"],
      provider
    );
    
    const name = await usdcContract.name();
    const symbol = await usdcContract.symbol();
    const decimals = await usdcContract.decimals();
    
    console.log(`✅ USDC: ${name} (${symbol}) - ${decimals} decimals`);
  } catch (error) {
    console.error("❌ USDC contract verification failed:", error.message);
  }

  // Verify SubscriptionManager contract
  console.log("\n📄 Verifying SubscriptionManager contract...");
  try {
    const subscriptionContract = new ethers.Contract(
      contracts.SubscriptionManager.address,
      ["function name() view returns (string)", "function symbol() view returns (string)", "function getAvailablePlans() view returns (tuple[])"],
      provider
    );
    
    const name = await subscriptionContract.name();
    const symbol = await subscriptionContract.symbol();
    const plans = await subscriptionContract.getAvailablePlans();
    
    console.log(`✅ SubscriptionManager: ${name} (${symbol})`);
    console.log(`📋 Available plans: ${plans.length}`);
    
    plans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.name} - $${ethers.utils.formatUnits(plan.price, 6)} USDC`);
    });
  } catch (error) {
    console.error("❌ SubscriptionManager contract verification failed:", error.message);
  }

  // Test contract interaction
  console.log("\n🧪 Testing contract interaction...");
  try {
    const subscriptionContract = new ethers.Contract(
      contracts.SubscriptionManager.address,
      ["function getAvailablePlans() view returns (tuple[])"],
      provider
    );
    
    const plans = await subscriptionContract.getAvailablePlans();
    if (plans.length > 0) {
      console.log("✅ Contract interaction successful");
      console.log(`📊 Found ${plans.length} subscription plans`);
    } else {
      console.log("⚠️  No subscription plans found");
    }
  } catch (error) {
    console.error("❌ Contract interaction failed:", error.message);
  }

  console.log("\n🎉 Deployment verification completed!");
  console.log("\n📋 Contract addresses:");
  console.log(`USDC: ${contracts.USDC.address}`);
  console.log(`SubscriptionManager: ${contracts.SubscriptionManager.address}`);
  
  console.log("\n🔗 View on Etherscan:");
  console.log(`USDC: https://sepolia.etherscan.io/address/${contracts.USDC.address}`);
  console.log(`SubscriptionManager: https://sepolia.etherscan.io/address/${contracts.SubscriptionManager.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
