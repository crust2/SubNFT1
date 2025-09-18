import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, SUBSCRIPTION_ABI, USDC_ABI } from "@/lib/web3-config"

// Hook to read available subscription plans
export function useSubscriptionPlans() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
    abi: SUBSCRIPTION_ABI,
    functionName: "getAvailablePlans",
  })
}

// Hook to read user's subscriptions
export function useUserSubscriptions(userAddress?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
    abi: SUBSCRIPTION_ABI,
    functionName: "getUserSubscriptions",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to read subscription details for a specific token ID
export function useSubscriptionDetails(tokenId?: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
    abi: SUBSCRIPTION_ABI,
    functionName: "getSubscriptionDetails",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  })
}

// Hook to read USDC balance
export function useUSDCBalance(userAddress?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.USDC_TOKEN as `0x${string}`,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to read USDC allowance
export function useUSDCAllowance(userAddress?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.USDC_TOKEN as `0x${string}`,
    abi: USDC_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook for contract write operations
export function useSubscriptionActions() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const subscribe = async (planId: bigint, duration: bigint, value: bigint) => {
    // First approve USDC spending
    await writeContract({
      address: CONTRACT_ADDRESSES.USDC_TOKEN as `0x${string}`,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER, value],
    })
    
    // Wait a bit for approval to be processed
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Then subscribe
    writeContract({
      address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "subscribe",
      args: [planId, duration],
    })
  }

  const renewSubscription = async (tokenId: bigint, value: bigint) => {
    // First approve USDC spending
    await writeContract({
      address: CONTRACT_ADDRESSES.USDC_TOKEN as `0x${string}`,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER, value],
    })
    
    // Wait a bit for approval to be processed
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Then renew subscription
    writeContract({
      address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "renewSubscription",
      args: [tokenId],
    })
  }

  const cancelSubscription = (tokenId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "cancelSubscription",
      args: [tokenId],
    })
  }

  const approveUSDC = (amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.USDC_TOKEN as `0x${string}`,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER, amount],
    })
  }

  const getTestUSDC = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.USDC_TOKEN as `0x${string}`,
      abi: USDC_ABI,
      functionName: "faucet",
      args: [],
    })
  }

  const toggleAutoRenewal = (tokenId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "toggleAutoRenewal",
      args: [tokenId],
    })
  }

  const processAutoRenewal = (tokenId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.SUBSCRIPTION_MANAGER as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "processAutoRenewal",
      args: [tokenId],
    })
  }

  return {
    subscribe,
    renewSubscription,
    cancelSubscription,
    approveUSDC,
    getTestUSDC,
    toggleAutoRenewal,
    processAutoRenewal,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}
