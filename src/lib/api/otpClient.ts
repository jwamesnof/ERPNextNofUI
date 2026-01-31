import type { OTPRequest, OTPResponse, HealthResponse } from "@/types/otp"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001"

let healthLogged = false

class OTPClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  getBaseUrl() {
    return this.baseUrl
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      const data = await response.json()

      if (!healthLogged) {
        console.log("[OTPClient] Backend is healthy:", data)
        healthLogged = true
      }

      return data
    } catch (error) {
      console.error("[OTPClient] Health check failed:", error)
      throw error
    }
  }

  async evaluatePromise(request: OTPRequest): Promise<OTPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/otp/promise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.detail || `Promise evaluation failed: ${response.status}`
        )
      }

      const data = await response.json()
      console.log("[OTPClient] Promise evaluation result:", data)

      return data
    } catch (error) {
      console.error("[OTPClient] Promise evaluation failed:", error)
      throw error
    }
  }
}

export const otpClient = new OTPClient()
