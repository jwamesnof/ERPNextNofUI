/**
 * OTP API Client
 * Centralized API communication for the Order Promise Engine
 */

import type {
  PromiseEvaluateRequest,
  PromiseEvaluateResponse,
  HealthCheckResponse,
  APIError,
} from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001"

let healthCheckLogged = false
let salesOrdersWarned = false

export type PromiseRequest = PromiseEvaluateRequest
export type PromiseResponse = PromiseEvaluateResponse
export type HealthResponse = HealthCheckResponse

function buildAPIError(message: string, statusCode?: number, detail?: string): APIError {
  return {
    message,
    code: statusCode ? `HTTP_${statusCode}` : "UNKNOWN_ERROR",
    statusCode: statusCode || 0,
    detail,
  }
}

/**
 * Health check - verify backend connectivity
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw buildAPIError("Health check failed", response.status, response.statusText);
    }

    const data = await response.json();

    if (!healthCheckLogged) {
      console.info("[OTP API] Health check passed", {
        status: data.status,
        timestamp: new Date().toISOString(),
      });
      healthCheckLogged = true;
    }

    return data as HealthResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * Evaluate promise - calculate delivery promise for an order
 */
export async function evaluatePromise(request: PromiseRequest): Promise<PromiseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/otp/promise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw buildAPIError("Promise evaluation failed", response.status, errorText);
    }

    const data = await response.json();
    return data as PromiseResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch sales orders list (NOT YET IMPLEMENTED in backend)
 */
export async function fetchSalesOrders(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/otp/sales-orders`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if ((response.status === 404 || response.status === 501) && !salesOrdersWarned) {
        console.warn("[OTP API] /otp/sales-orders unavailable (expected)")
        salesOrdersWarned = true
      }
      throw buildAPIError("Sales orders fetch failed", response.status, response.statusText);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    throw error;
  }
}

export const otpApiClient = {
  checkHealth,
  evaluatePromise,
  fetchSalesOrders,
  getBaseUrl: () => API_BASE_URL,
};
