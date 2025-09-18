"use client"

import { Header } from "@/components/header"
import { PlanListing } from "@/components/plan-listing"
import { MySubscriptions } from "@/components/my-subscriptions"
import { useAccount } from "wagmi"
import { useEffect, useState } from "react"

export default function Home() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-16">
        <section className="text-center space-y-6 py-16">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              SubNFT
            </h1>
            <p className="text-2xl font-medium text-muted-foreground/80 mb-2">Premium NFT Subscriptions Made Simple</p>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Subscribe to premium content and receive exclusive NFT tokens as proof of membership. Unlock Web3
              experiences with blockchain-powered subscriptions.
            </p>
          </div>

          {mounted && !isConnected && (
            <div className="flex justify-center pt-8">
              <div className="glass rounded-2xl p-6 max-w-sm text-center">
                <h3 className="text-lg font-semibold mb-3">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Connect your wallet to browse subscription plans and manage your NFT memberships
                </p>
                <div className="flex justify-center">
                  <w3m-button />
                </div>
              </div>
            </div>
          )}
        </section>

        <PlanListing />

        {mounted && isConnected && <MySubscriptions />}
      </main>
    </div>
  )
}
