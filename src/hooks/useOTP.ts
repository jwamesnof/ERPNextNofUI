"use client"

import { useMutation } from "@tanstack/react-query"
import { otpApiClient } from "@/lib/api/otp-client"
import type { OTPRequest, OTPResponse } from "@/types/otp"

export function useEvaluatePromise() {
  return useMutation({
    mutationFn: (request: OTPRequest) => otpApiClient.evaluatePromise(request),
  })
}
