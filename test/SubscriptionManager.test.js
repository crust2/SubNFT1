const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SubscriptionManager", function () {
  let subscriptionManager;
  let usdc;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy USDC token
    const USDC = await ethers.getContractFactory("USDC");
    usdc = await USDC.deploy();
    await usdc.deployed();

    // Deploy SubscriptionManager
    const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
    subscriptionManager = await SubscriptionManager.deploy(usdc.address);
    await subscriptionManager.deployed();

    // Give users some USDC for testing
    await usdc.connect(owner).transfer(user1.address, ethers.utils.parseUnits("1000", 6));
    await usdc.connect(owner).transfer(user2.address, ethers.utils.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      expect(await subscriptionManager.usdcToken()).to.equal(usdc.address);
    });

    it("Should create default subscription plans", async function () {
      const plans = await subscriptionManager.getAvailablePlans();
      expect(plans.length).to.equal(3);
      expect(plans[0].name).to.equal("DeFi Analytics Pro");
      expect(plans[1].name).to.equal("Web3 Gaming Hub");
      expect(plans[2].name).to.equal("NFT Marketplace Plus");
    });
  });

  describe("Subscription Creation", function () {
    it("Should allow users to subscribe to a plan", async function () {
      const planId = 1;
      const duration = 30 * 24 * 60 * 60; // 30 days
      
      // Approve USDC spending
      await usdc.connect(user1).approve(subscriptionManager.address, ethers.utils.parseUnits("29.99", 6));
      
      // Subscribe
      await subscriptionManager.connect(user1).subscribe(planId, duration);
      
      // Check NFT was minted
      expect(await subscriptionManager.balanceOf(user1.address)).to.equal(1);
      expect(await subscriptionManager.ownerOf(0)).to.equal(user1.address);
      
      // Check subscription details
      const details = await subscriptionManager.getSubscriptionDetails(0);
      expect(details.planId).to.equal(planId);
      expect(details.isActive).to.be.true;
    });

    it("Should track user subscriptions", async function () {
      const planId = 1;
      const duration = 30 * 24 * 60 * 60;
      
      // Approve and subscribe
      await usdc.connect(user1).approve(subscriptionManager.address, ethers.utils.parseUnits("29.99", 6));
      await subscriptionManager.connect(user1).subscribe(planId, duration);
      
      // Check user subscriptions
      const userSubscriptions = await subscriptionManager.getUserSubscriptions(user1.address);
      expect(userSubscriptions.length).to.equal(1);
      expect(userSubscriptions[0]).to.equal(0);
    });
  });

  describe("Subscription Renewal", function () {
    it("Should allow subscription renewal", async function () {
      const planId = 1;
      const duration = 30 * 24 * 60 * 60;
      
      // Subscribe first
      await usdc.connect(user1).approve(subscriptionManager.address, ethers.utils.parseUnits("29.99", 6));
      await subscriptionManager.connect(user1).subscribe(planId, duration);
      
      const tokenId = 0;
      const originalExpiry = (await subscriptionManager.getSubscriptionDetails(tokenId)).expiryDate;
      
      // Approve for renewal
      await usdc.connect(user1).approve(subscriptionManager.address, ethers.utils.parseUnits("29.99", 6));
      
      // Renew subscription
      await subscriptionManager.connect(user1).renewSubscription(tokenId);
      
      // Check expiry date was extended
      const newDetails = await subscriptionManager.getSubscriptionDetails(tokenId);
      expect(newDetails.expiryDate).to.be.gt(originalExpiry);
    });
  });

  describe("Subscription Cancellation", function () {
    it("Should allow subscription cancellation with refund", async function () {
      const planId = 1;
      const duration = 30 * 24 * 60 * 60;
      
      // Subscribe first
      await usdc.connect(user1).approve(subscriptionManager.address, ethers.utils.parseUnits("29.99", 6));
      await subscriptionManager.connect(user1).subscribe(planId, duration);
      
      const tokenId = 0;
      const balanceBefore = await usdc.balanceOf(user1.address);
      
      // Cancel subscription
      await subscriptionManager.connect(user1).cancelSubscription(tokenId);
      
      // Check NFT was burned
      await expect(subscriptionManager.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
      
      // Check refund was given (should be close to full amount since just created)
      const balanceAfter = await usdc.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Plan Management", function () {
    it("Should allow owner to create new plans", async function () {
      await subscriptionManager.connect(owner).createPlan(
        "New Plan",
        ethers.utils.parseUnits("49.99", 6),
        "A new subscription plan"
      );
      
      const plans = await subscriptionManager.getAvailablePlans();
      expect(plans.length).to.equal(4);
      expect(plans[3].name).to.equal("New Plan");
    });

    it("Should not allow non-owners to create plans", async function () {
      await expect(
        subscriptionManager.connect(user1).createPlan(
          "New Plan",
          ethers.utils.parseUnits("49.99", 6),
          "A new subscription plan"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("USDC Integration", function () {
    it("Should transfer USDC on subscription", async function () {
      const planId = 1;
      const duration = 30 * 24 * 60 * 60;
      const planPrice = ethers.utils.parseUnits("29.99", 6);
      
      const contractBalanceBefore = await usdc.balanceOf(subscriptionManager.address);
      const userBalanceBefore = await usdc.balanceOf(user1.address);
      
      // Approve and subscribe
      await usdc.connect(user1).approve(subscriptionManager.address, planPrice);
      await subscriptionManager.connect(user1).subscribe(planId, duration);
      
      // Check USDC was transferred
      const contractBalanceAfter = await usdc.balanceOf(subscriptionManager.address);
      const userBalanceAfter = await usdc.balanceOf(user1.address);
      
      expect(contractBalanceAfter).to.equal(contractBalanceBefore.add(planPrice));
      expect(userBalanceAfter).to.equal(userBalanceBefore.sub(planPrice));
    });
  });
});
