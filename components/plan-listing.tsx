"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Star, Zap, Loader2, RefreshCw, Shield, Users } from "lucide-react"
import { useAccount } from "wagmi"
import { useSubscriptionPlans, useSubscriptionActions } from "@/hooks/use-subscription-contract"
import { formatUSDC, MOCK_PLANS } from "@/lib/subscription-utils"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export function PlanListing() {
  const { isConnected } = useAccount()
  const [subscribingTo, setSubscribingTo] = useState<bigint | null>(null)
  const [autoRenewal, setAutoRenewal] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: contractPlans, isLoading, error } = useSubscriptionPlans()
  const { subscribe, isPending, isConfirming, isConfirmed, error: txError } = useSubscriptionActions()

  // Use mock data if contract data is not available
  const plans = contractPlans?.length ? contractPlans : MOCK_PLANS

  const handleSubscribe = async (planId: bigint, price: bigint) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    setSubscribingTo(planId)
    try {
      // Subscribe for 30 days (30 * 24 * 60 * 60 seconds)
      const duration = BigInt(30 * 24 * 60 * 60)
      subscribe(planId, duration, price)

      toast.success("Subscription transaction initiated!")
    } catch (error) {
      console.error("Subscription error:", error)
      toast.error("Failed to initiate subscription")
    } finally {
      setSubscribingTo(null)
    }
  }

  const toggleAutoRenewal = (planId: string) => {
    setAutoRenewal((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }))
  }

  if (isConfirmed) {
    toast.success("Subscription successful!")
  }

  if (txError) {
    toast.error("Transaction failed: " + txError.message)
  }

  return (
    <section className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-balance">Premium NFT Subscriptions</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Subscribe to exclusive Web3 experiences and receive unique NFT tokens as proof of membership
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Using demo data - connect to see live plans</p>
        </div>
      )}

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {plans.map((plan, index) => (
            <Card
              key={plan.id.toString()}
              className={`glass w-full max-w-sm mx-auto p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl relative ${
                index === 0 ? "glow-green" : ""
              }`}
            >
              {index === 0 && (
                <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <div className="space-y-6">
                {/* NFT Preview */}
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                  <img
                    src={`/abstract-geometric-shapes.png?height=280&width=280&query=${plan.name} NFT subscription token`}
                    alt={`${plan.name} NFT`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Plan Details */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-card-foreground">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary">${formatUSDC(plan.price)}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-pretty text-sm">{plan.description}</p>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-secondary" />
                      <span>Exclusive content access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-secondary" />
                      <span>NFT membership token</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-secondary" />
                      <span>Premium community access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="w-4 h-4 text-secondary" />
                      <span>Monthly exclusive drops</span>
                    </div>
                  </div>

                  {/* Auto-renewal Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Auto-renewal</p>
                      <p className="text-xs text-muted-foreground">Automatically renew monthly</p>
                    </div>
                    <Switch
                      checked={autoRenewal[plan.id.toString()] || false}
                      onCheckedChange={() => toggleAutoRenewal(plan.id.toString())}
                    />
                  </div>

                  {/* Subscribe Button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-all duration-300 hover:shadow-lg"
                    size="lg"
                    onClick={() => handleSubscribe(plan.id, plan.price)}
                    disabled={!isConnected || isPending || isConfirming || subscribingTo === plan.id}
                  >
                    {subscribingTo === plan.id || (isPending && subscribingTo === plan.id) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isConfirming ? "Confirming..." : "Minting NFT..."}
                      </>
                    ) : (
                      "Subscribe & Mint NFT"
                    )}
                  </Button>

                  {/* Additional Info */}
                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>✨ Receive unique NFT upon subscription</p>
                    <p>🔄 Cancel anytime with pro-rated refund</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
