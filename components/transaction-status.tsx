"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TransactionStatusProps {
  hash?: `0x${string}`
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  error?: Error | null
  onSuccess?: () => void
  onError?: () => void
}

export function TransactionStatus({
  hash,
  isPending,
  isConfirming,
  isConfirmed,
  error,
  onSuccess,
  onError,
}: TransactionStatusProps) {
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div>
            <p className="font-semibold">Transaction Confirmed!</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
              onClick={() => window.open(`https://etherscan.io/tx/${hash}`, "_blank")}
            >
              View on Etherscan <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>,
        { duration: 5000 },
      )
      onSuccess?.()
    }
  }, [isConfirmed, hash, onSuccess])

  useEffect(() => {
    if (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <div>
            <p className="font-semibold">Transaction Failed</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
          </div>
        </div>,
        { duration: 5000 },
      )
      onError?.()
    }
  }, [error, onError])

  useEffect(() => {
    if (isPending) {
      toast.loading(
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <p>Transaction submitted, waiting for confirmation...</p>
        </div>,
        { id: hash },
      )
    }
  }, [isPending, hash])

  useEffect(() => {
    if (isConfirming && hash) {
      toast.loading(
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <div>
            <p>Confirming transaction...</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
              onClick={() => window.open(`https://etherscan.io/tx/${hash}`, "_blank")}
            >
              View on Etherscan <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>,
        { id: hash },
      )
    }
  }, [isConfirming, hash])

  return null
}
