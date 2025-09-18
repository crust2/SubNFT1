"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { useUSDCAllowance, useSubscriptionActions } from "@/hooks/use-subscription-contract"
import { formatUSDC } from "@/lib/subscription-utils"
import { toast } from "sonner"

interface SubscriptionApprovalProps {
  planId: bigint
  planName: string
  price: bigint
  onApprovalComplete: () => void
}

export function SubscriptionApproval({ planId, planName, price, onApprovalComplete }: SubscriptionApprovalProps) {
  const { address } = useAccount()
  const [isApproving, setIsApproving] = useState(false)

  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(address)
  const { approveUSDC, isPending, isConfirming, isConfirmed, error } = useSubscriptionActions()

  const needsApproval = allowance !== undefined && allowance < price
  const hasEnoughAllowance = allowance !== undefined && allowance >= price

  useEffect(() => {
    if (isConfirmed) {
      toast.success("USDC approval confirmed!")
      refetchAllowance()
      onApprovalComplete()
      setIsApproving(false)
    }
  }, [isConfirmed, refetchAllowance, onApprovalComplete])

  useEffect(() => {
    if (error) {
      toast.error("Approval failed: " + error.message)
      setIsApproving(false)
    }
  }, [error])

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      // Approve a large amount to avoid repeated approvals
      const approvalAmount = price * 10n // Approve 10x the price
      approveUSDC(approvalAmount)
      toast.success("Approval transaction submitted!")
    } catch (error) {
      console.error("Approval error:", error)
      toast.error("Failed to approve USDC")
      setIsApproving(false)
    }
  }

  if (hasEnoughAllowance) {
    return (
      <Card className="glass p-4 border-green-500/30">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-semibold text-green-400">USDC Approved</p>
            <p className="text-sm text-muted-foreground">Ready to subscribe to {planName}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (needsApproval) {
    return (
      <Card className="glass p-4 border-orange-500/30">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-semibold text-orange-400">USDC Approval Required</p>
              <p className="text-sm text-muted-foreground">
                Approve ${formatUSDC(price)} USDC to subscribe to {planName}
              </p>
            </div>
          </div>

          <Button
            onClick={handleApprove}
            disabled={isApproving || isPending || isConfirming}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isApproving || isPending || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Approving..."}
              </>
            ) : (
              `Approve ${formatUSDC(price)} USDC`
            )}
          </Button>
        </div>
      </Card>
    )
  }

  return null
}
