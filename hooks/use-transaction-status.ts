"use client"

import { useEffect, useState } from "react"
import { useWaitForTransactionReceipt } from "wagmi"

interface UseTransactionStatusProps {
  hash?: `0x${string}`
  onSuccess?: (receipt: any) => void
  onError?: (error: Error) => void
}

export function useTransactionStatus({ hash, onSuccess, onError }: UseTransactionStatusProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  })

  useEffect(() => {
    if (hash) {
      setIsProcessing(true)
    }
  }, [hash])

  useEffect(() => {
    if (isConfirmed && receipt) {
      setIsProcessing(false)
      onSuccess?.(receipt)
    }
  }, [isConfirmed, receipt, onSuccess])

  useEffect(() => {
    if (error) {
      setIsProcessing(false)
      onError?.(error as Error)
    }
  }, [error, onError])

  return {
    receipt,
    isConfirming,
    isConfirmed,
    isProcessing,
    error: error as Error | null,
  }
}
