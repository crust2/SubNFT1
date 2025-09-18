"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar, RefreshCw, X, Loader2, Settings, Download } from "lucide-react"
import { useAccount } from "wagmi"
import { useUserSubscriptions, useSubscriptionActions } from "@/hooks/use-subscription-contract"
import {
  formatExpiryDate,
  getDaysRemaining,
  MOCK_USER_SUBSCRIPTIONS,
  MOCK_PLANS,
  formatUserSubscription,
} from "@/lib/subscription-utils"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export function MySubscriptions() {
  const { address, isConnected } = useAccount()
  const [actioningToken, setActioningToken] = useState<bigint | null>(null)
  const [autoRenewalSettings, setAutoRenewalSettings] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: userTokenIds, isLoading } = useUserSubscriptions(address)
  const { 
    renewSubscription, 
    cancelSubscription, 
    toggleAutoRenewal, 
    processAutoRenewal,
    isPending, 
    isConfirming, 
    error: txError 
  } = useSubscriptionActions()

  // For demo purposes, use mock data if no real data
  const subscriptions = userTokenIds?.length
    ? userTokenIds.map((tokenId) => {
        // In a real app, you'd fetch details for each token
        const mockSub = MOCK_USER_SUBSCRIPTIONS.find((s) => s.tokenId === tokenId) || MOCK_USER_SUBSCRIPTIONS[0]
        const planDetails = MOCK_PLANS.find((p) => p.id === mockSub.planId)
        return formatUserSubscription(tokenId, mockSub, planDetails)
      })
    : MOCK_USER_SUBSCRIPTIONS.map((sub) => {
        const planDetails = MOCK_PLANS.find((p) => p.id === sub.planId)
        return formatUserSubscription(sub.tokenId, sub, planDetails)
      })

  const handleRenew = async (tokenId: bigint, price: bigint) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    setActioningToken(tokenId)
    try {
      renewSubscription(tokenId, price)
      toast.success("Renewal transaction initiated!")
    } catch (error) {
      console.error("Renewal error:", error)
      toast.error("Failed to renew subscription")
    } finally {
      setActioningToken(null)
    }
  }

  const handleCancel = async (tokenId: bigint) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    setActioningToken(tokenId)
    try {
      cancelSubscription(tokenId)
      toast.success("Cancellation transaction initiated!")
    } catch (error) {
      console.error("Cancellation error:", error)
      toast.error("Failed to cancel subscription")
    } finally {
      setActioningToken(null)
    }
  }

  const handleToggleAutoRenewal = async (tokenId: bigint) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    setActioningToken(tokenId)
    try {
      toggleAutoRenewal(tokenId)
      toast.success("Auto-renewal toggled!")
    } catch (error) {
      console.error("Auto-renewal toggle error:", error)
      toast.error("Failed to toggle auto-renewal")
    } finally {
      setActioningToken(null)
    }
  }

  const handleProcessAutoRenewal = async (tokenId: bigint) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    setActioningToken(tokenId)
    try {
      processAutoRenewal(tokenId)
      toast.success("Auto-renewal processed!")
    } catch (error) {
      console.error("Auto-renewal process error:", error)
      toast.error("Failed to process auto-renewal")
    } finally {
      setActioningToken(null)
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "expiring":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "expired":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getGlowClass = (status: string) => {
    switch (status) {
      case "active":
        return "glow-green"
      case "expiring":
        return "glow-orange"
      case "expired":
        return "glow-red"
      default:
        return ""
    }
  }

  return (
    <section className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-balance">My NFT Subscriptions</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Manage your active NFT subscriptions, renewals, and membership tokens
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isConnected && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Connect your wallet to view your subscriptions</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subscriptions.map((sub) => {
          const daysRemaining = getDaysRemaining(sub.expiryDate)
          const status = daysRemaining > 7 ? "active" : daysRemaining > 0 ? "expiring" : "expired"

          return (
            <Card
              key={sub.tokenId.toString()}
              className={`glass p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden ${getGlowClass(status)}`}
            >
              <Badge className={`absolute top-4 right-4 ${getStatusColor(status)} font-semibold`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>

              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted/20">
                  <img
                    src={`/abstract-geometric-shapes.png?key=vfc6a&height=300&width=300&query=${sub.planDetails?.name || "NFT"} subscription token`}
                    alt={`${sub.planDetails?.name || "Subscription"} NFT`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-card-foreground">{sub.planDetails?.name || "Unknown Plan"}</h3>
                  <p className="text-sm text-muted-foreground">NFT ID: #{sub.tokenId.toString()}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Expires: {formatExpiryDate(sub.expiryDate)}</span>
                  </div>
                  {daysRemaining > 0 && <p className="text-xs text-muted-foreground">{daysRemaining} days remaining</p>}

                  {/* Auto-renewal Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/10 border border-border/30">
                    <span className="text-sm">Auto-renewal</span>
                    <Switch
                      checked={autoRenewalSettings[sub.tokenId.toString()] || false}
                      onCheckedChange={() => handleToggleAutoRenewal(sub.tokenId)}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="backdrop-blur-2xl bg-slate-800/90 border border-slate-400/30 hover:bg-primary/10 border-primary/30 text-primary hover:text-primary bg-transparent"
                    onClick={() => handleRenew(sub.tokenId, sub.planDetails?.price || 0n)}
                    disabled={isPending || isConfirming || actioningToken === sub.tokenId}
                  >
                    {actioningToken === sub.tokenId && isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Renew
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="backdrop-blur-2xl bg-slate-800/90 border border-slate-400/30 hover:bg-secondary/10 border-secondary/30 text-secondary hover:text-secondary bg-transparent"
                    disabled
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="backdrop-blur-2xl bg-slate-800/90 border border-slate-400/30 hover:bg-primary/10 border-primary/30 text-primary hover:text-primary bg-transparent"
                    onClick={() => handleProcessAutoRenewal(sub.tokenId)}
                    disabled={isPending || isConfirming || actioningToken === sub.tokenId || daysRemaining > 0}
                  >
                    {actioningToken === sub.tokenId && isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Auto-renew
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="backdrop-blur-2xl bg-slate-800/90 border border-slate-400/30 hover:bg-destructive/10 border-destructive/30 text-destructive hover:text-destructive bg-transparent"
                    onClick={() => handleCancel(sub.tokenId)}
                    disabled={isPending || isConfirming || actioningToken === sub.tokenId}
                  >
                    {actioningToken === sub.tokenId && isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Cancel & Refund
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
