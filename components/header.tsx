"use client"

import { useAccount, useBalance } from "wagmi"
import { formatUSDC } from "@/lib/subscription-utils"
import { CONTRACT_ADDRESSES } from "@/lib/web3-config"
import { useSubscriptionActions } from "@/hooks/use-subscription-contract"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const { getTestUSDC, isPending } = useSubscriptionActions()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: usdcBalance } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.USDC_TOKEN as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    },
  })

  return (
    <header className="glass sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SubNFT
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {mounted && isConnected && (
              <div className="flex items-center gap-3">
                {usdcBalance && (
                  <div className="glass px-4 py-2 rounded-full border-primary/20">
                    <span className="text-sm text-muted-foreground">USDC:</span>
                    <span className="ml-2 font-semibold text-primary">${formatUSDC(usdcBalance.value)}</span>
                  </div>
                )}
                <Button
                  onClick={getTestUSDC}
                  disabled={isPending}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  {isPending ? "Getting..." : "Get Test USDC"}
                </Button>
              </div>
            )}

            {mounted && <w3m-button />}
          </div>
        </div>
      </div>
    </header>
  )
}
