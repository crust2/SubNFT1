import { formatUnits, parseUnits } from "viem"
import type { SubscriptionPlan, UserSubscription, SubscriptionStatus } from "./web3-config"
import { getSubscriptionStatus } from "./web3-config"

// Format USDC amount (6 decimals)
export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6)
}

// Parse USDC amount to wei
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6)
}

// Format subscription plan for display
export function formatSubscriptionPlan(plan: any): SubscriptionPlan {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    description: plan.description,
    creator: plan.creator,
  }
}

// Format user subscription with status
export function formatUserSubscription(
  tokenId: bigint,
  details: any,
  planDetails?: SubscriptionPlan,
): UserSubscription & { statusInfo: SubscriptionStatus } {
  const statusInfo = getSubscriptionStatus(details.expiryDate)

  return {
    tokenId,
    planId: details.planId,
    expiryDate: details.expiryDate,
    isActive: details.isActive,
    planDetails,
    statusInfo,
  }
}

// Calculate days remaining
export function getDaysRemaining(expiryDate: bigint): number {
  const now = Math.floor(Date.now() / 1000)
  const expiry = Number(expiryDate)
  return Math.max(0, Math.ceil((expiry - now) / (24 * 60 * 60)))
}

// Format expiry date
export function formatExpiryDate(expiryDate: bigint): string {
  const date = new Date(Number(expiryDate) * 1000)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Get status color classes for UI
export function getStatusColorClasses(status: SubscriptionStatus["status"]) {
  switch (status) {
    case "active":
      return {
        border: "border-green-500/50",
        glow: "shadow-green-500/20",
        text: "text-green-400",
        bg: "bg-green-500/10",
      }
    case "expiring":
      return {
        border: "border-orange-500/50",
        glow: "shadow-orange-500/20",
        text: "text-orange-400",
        bg: "bg-orange-500/10",
      }
    case "expired":
      return {
        border: "border-red-500/50",
        glow: "shadow-red-500/20",
        text: "text-red-400",
        bg: "bg-red-500/10",
      }
    default:
      return {
        border: "border-border",
        glow: "shadow-none",
        text: "text-muted-foreground",
        bg: "bg-muted/10",
      }
  }
}

// Mock data for development/testing
export const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 1n,
    name: "DeFi Analytics Pro",
    price: parseUSDC("29.99"),
    description: "Advanced DeFi analytics and portfolio tracking",
    creator: "0x1234567890123456789012345678901234567890",
  },
  {
    id: 2n,
    name: "Web3 Gaming Hub",
    price: parseUSDC("19.99"),
    description: "Premium gaming features and exclusive NFT drops",
    creator: "0x2345678901234567890123456789012345678901",
  },
  {
    id: 3n,
    name: "NFT Marketplace Plus",
    price: parseUSDC("39.99"),
    description: "Advanced NFT trading tools and market insights",
    creator: "0x3456789012345678901234567890123456789012",
  },
]

export const MOCK_USER_SUBSCRIPTIONS = [
  {
    tokenId: 1n,
    planId: 1n,
    expiryDate: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60), // 30 days from now
    isActive: true,
  },
  {
    tokenId: 2n,
    planId: 2n,
    expiryDate: BigInt(Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60), // 5 days from now
    isActive: true,
  },
  {
    tokenId: 3n,
    planId: 3n,
    expiryDate: BigInt(Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60), // 5 days ago
    isActive: false,
  },
]
