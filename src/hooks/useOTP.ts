"use client"

import { useMutation } from "@tanstack/react-query"
import { otpClient } from "@/lib/api/otpClient"
import type { PromiseEvaluateRequest } from "@/lib/api/types"

export function useEvaluatePromise() {
  return useMutation({
    mutationFn: (request: PromiseEvaluateRequest) => otpClient.evaluatePromise(request),
  })
}
