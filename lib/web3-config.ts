import { mainnet, sepolia, polygon, polygonMumbai } from "wagmi/chains"
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config"

// Contract addresses - replace with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  SUBSCRIPTION_MANAGER: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT || "0xaE0Ee3F2A610b981994653671bf8C6dBef8A8749",
  USDC_TOKEN: process.env.NEXT_PUBLIC_USDC_CONTRACT || "0x6E22Bc1f1B1d9f58A765142eb307909CcaF15496",
} as const

// Subscription contract ABI - matches deployed contract
export const SUBSCRIPTION_ABI = [
  // ERC721 functions
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Subscription management functions
  {
    inputs: [
      { name: "planId", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    name: "subscribe",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "renewSubscription",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "cancelSubscription",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "toggleAutoRenewal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "processAutoRenewal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "isSubscriptionExpired",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getSubscriptionDetails",
    outputs: [
      { name: "planId", type: "uint256" },
      { name: "expiryDate", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserSubscriptions",
    outputs: [{ name: "tokenIds", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAvailablePlans",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "price", type: "uint256" },
          { name: "description", type: "string" },
          { name: "creator", type: "address" },
          { name: "isActive", type: "bool" },
        ],
        name: "plans",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

// USDC token ABI (standard ERC20)
export const USDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "c4f79cc821944d9680842e34466bfbd"

const metadata = {
  name: "SubNFT",
  description: "Premium NFT subscription platform - Subscribe to exclusive content and receive NFT membership tokens",
  url: "https://subnft.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
}

export const config = defaultWagmiConfig({
  chains: [mainnet, polygon, sepolia, polygonMumbai],
  projectId,
  metadata,
})

// Types for subscription data
export interface SubscriptionPlan {
  id: bigint
  name: string
  price: bigint
  description: string
  creator: string
}

export interface UserSubscription {
  tokenId: bigint
  planId: bigint
  expiryDate: bigint
  isActive: boolean
  planDetails?: SubscriptionPlan
}

export interface SubscriptionStatus {
  status: "active" | "expiring" | "expired"
  color: "green" | "orange" | "red"
  daysRemaining: number
}

// Helper function to determine subscription status
export function getSubscriptionStatus(expiryDate: bigint): SubscriptionStatus {
  const now = Math.floor(Date.now() / 1000)
  const expiry = Number(expiryDate)
  const daysRemaining = Math.ceil((expiry - now) / (24 * 60 * 60))

  if (daysRemaining > 7) {
    return { status: "active", color: "green", daysRemaining }
  } else if (daysRemaining > 0) {
    return { status: "expiring", color: "orange", daysRemaining }
  } else {
    return { status: "expired", color: "red", daysRemaining: 0 }
  }
}
