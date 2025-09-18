const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Load contract ABIs and addresses
let contractABIs = {};
let contractAddresses = {};

try {
  // Load contract ABIs from artifacts
  const subscriptionManagerArtifact = require('../artifacts/contracts/SubscriptionManager.sol/SubscriptionManager.json');
  const usdcArtifact = require('../artifacts/contracts/USDC.sol/USDC.json');
  
  contractABIs = {
    subscriptionManager: subscriptionManagerArtifact.abi,
    usdc: usdcArtifact.abi
  };

  // Load contract addresses from environment or deployment info
  contractAddresses = {
    subscriptionManager: process.env.SUBSCRIPTION_CONTRACT_ADDRESS,
    usdc: process.env.USDC_CONTRACT_ADDRESS
  };

  console.log('✅ Contract ABIs and addresses loaded successfully');
} catch (error) {
  console.error('❌ Error loading contract artifacts:', error.message);
  console.log('⚠️  Make sure to compile contracts first: npx hardhat compile');
}

// Initialize provider and signer
let provider, signer, subscriptionManagerContract, usdcContract;

try {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  if (contractAddresses.subscriptionManager && contractAddresses.usdc) {
    subscriptionManagerContract = new ethers.Contract(
      contractAddresses.subscriptionManager,
      contractABIs.subscriptionManager,
      signer
    );
    
    usdcContract = new ethers.Contract(
      contractAddresses.usdc,
      contractABIs.usdc,
      signer
    );
  }
  
  console.log('✅ Provider and contracts initialized');
} catch (error) {
  console.error('❌ Error initializing provider/contracts:', error.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    network: 'sepolia',
    contracts: {
      subscriptionManager: contractAddresses.subscriptionManager || 'not deployed',
      usdc: contractAddresses.usdc || 'not deployed'
    }
  });
});

// Get available subscription plans
app.get('/api/plans', async (req, res) => {
  try {
    if (!subscriptionManagerContract) {
      return res.status(500).json({ error: 'Contract not initialized' });
    }

    const plans = await subscriptionManagerContract.getAvailablePlans();
    const formattedPlans = plans.map(plan => ({
      id: plan.id.toString(),
      name: plan.name,
      price: plan.price.toString(),
      description: plan.description,
      creator: plan.creator,
      isActive: plan.isActive
    }));

    res.json(formattedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get user's subscriptions
app.get('/api/subscriptions/:userAddress', async (req, res) => {
  try {
    if (!subscriptionManagerContract) {
      return res.status(500).json({ error: 'Contract not initialized' });
    }

    const { userAddress } = req.params;
    const tokenIds = await subscriptionManagerContract.getUserSubscriptions(userAddress);
    
    const subscriptions = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const details = await subscriptionManagerContract.getSubscriptionDetails(tokenId);
        return {
          tokenId: tokenId.toString(),
          planId: details.planId.toString(),
          expiryDate: details.expiryDate.toString(),
          isActive: details.isActive
        };
      })
    );

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch user subscriptions' });
  }
});

// Get subscription details
app.get('/api/subscription/:tokenId', async (req, res) => {
  try {
    if (!subscriptionManagerContract) {
      return res.status(500).json({ error: 'Contract not initialized' });
    }

    const { tokenId } = req.params;
    const details = await subscriptionManagerContract.getSubscriptionDetails(tokenId);
    
    res.json({
      planId: details.planId.toString(),
      expiryDate: details.expiryDate.toString(),
      isActive: details.isActive
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details' });
  }
});

// Get USDC balance
app.get('/api/balance/usdc/:userAddress', async (req, res) => {
  try {
    if (!usdcContract) {
      return res.status(500).json({ error: 'USDC contract not initialized' });
    }

    const { userAddress } = req.params;
    const balance = await usdcContract.balanceOf(userAddress);
    
    res.json({
      balance: balance.toString(),
      formatted: ethers.formatUnits(balance, 6)
    });
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    res.status(500).json({ error: 'Failed to fetch USDC balance' });
  }
});

// Get USDC allowance
app.get('/api/allowance/usdc/:userAddress', async (req, res) => {
  try {
    if (!usdcContract || !contractAddresses.subscriptionManager) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const { userAddress } = req.params;
    const allowance = await usdcContract.allowance(userAddress, contractAddresses.subscriptionManager);
    
    res.json({
      allowance: allowance.toString(),
      formatted: ethers.formatUnits(allowance, 6)
    });
  } catch (error) {
    console.error('Error fetching USDC allowance:', error);
    res.status(500).json({ error: 'Failed to fetch USDC allowance' });
  }
});

// Subscribe to a plan (backend transaction)
app.post('/api/subscribe', async (req, res) => {
  try {
    if (!subscriptionManagerContract) {
      return res.status(500).json({ error: 'Contract not initialized' });
    }

    const { planId, duration, userAddress } = req.body;
    
    if (!planId || !duration || !userAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get plan details to calculate price
    const plans = await subscriptionManagerContract.getAvailablePlans();
    const plan = plans.find(p => p.id.toString() === planId.toString());
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Create transaction
    const tx = await subscriptionManagerContract.subscribe(planId, duration, {
      value: 0 // No ETH value needed, USDC will be transferred
    });

    res.json({
      success: true,
      transactionHash: tx.hash,
      planId: planId,
      price: plan.price.toString()
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription: ' + error.message });
  }
});

// Renew subscription
app.post('/api/renew', async (req, res) => {
  try {
    if (!subscriptionManagerContract) {
      return res.status(500).json({ error: 'Contract not initialized' });
    }

    const { tokenId } = req.body;
    
    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    const tx = await subscriptionManagerContract.renewSubscription(tokenId, {
      value: 0 // No ETH value needed, USDC will be transferred
    });

    res.json({
      success: true,
      transactionHash: tx.hash,
      tokenId: tokenId
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ error: 'Failed to renew subscription: ' + error.message });
  }
});

// Cancel subscription
app.post('/api/cancel', async (req, res) => {
  try {
    if (!subscriptionManagerContract) {
      return res.status(500).json({ error: 'Contract not initialized' });
    }

    const { tokenId } = req.body;
    
    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    const tx = await subscriptionManagerContract.cancelSubscription(tokenId);

    res.json({
      success: true,
      transactionHash: tx.hash,
      tokenId: tokenId
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription: ' + error.message });
  }
});

// Approve USDC spending
app.post('/api/approve/usdc', async (req, res) => {
  try {
    if (!usdcContract || !contractAddresses.subscriptionManager) {
      return res.status(500).json({ error: 'Contracts not initialized' });
    }

    const { amount, userAddress } = req.body;
    
    if (!amount || !userAddress) {
      return res.status(400).json({ error: 'Amount and user address are required' });
    }

    // This would typically be called by the frontend directly
    // But we can provide the transaction data for the frontend to sign
    const txData = await usdcContract.populateTransaction.approve(
      contractAddresses.subscriptionManager,
      amount
    );

    res.json({
      success: true,
      transactionData: txData,
      to: contractAddresses.usdc,
      value: '0x0'
    });
  } catch (error) {
    console.error('Error preparing USDC approval:', error);
    res.status(500).json({ error: 'Failed to prepare USDC approval: ' + error.message });
  }
});

// Get contract addresses and ABIs for frontend
app.get('/api/contracts', (req, res) => {
  res.json({
    addresses: contractAddresses,
    abis: contractABIs
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Network: Sepolia testnet`);
  console.log(`🔗 RPC URL: ${process.env.RPC_URL ? 'Configured' : 'Not configured'}`);
  console.log(`🔑 Private Key: ${process.env.PRIVATE_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`📄 Contracts: ${contractAddresses.subscriptionManager ? 'Deployed' : 'Not deployed'}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  GET  /api/plans - Get subscription plans`);
  console.log(`  GET  /api/subscriptions/:userAddress - Get user subscriptions`);
  console.log(`  GET  /api/subscription/:tokenId - Get subscription details`);
  console.log(`  GET  /api/balance/usdc/:userAddress - Get USDC balance`);
  console.log(`  GET  /api/allowance/usdc/:userAddress - Get USDC allowance`);
  console.log(`  POST /api/subscribe - Create subscription`);
  console.log(`  POST /api/renew - Renew subscription`);
  console.log(`  POST /api/cancel - Cancel subscription`);
  console.log(`  POST /api/approve/usdc - Approve USDC spending`);
  console.log(`  GET  /api/contracts - Get contract info`);
});

module.exports = app;
