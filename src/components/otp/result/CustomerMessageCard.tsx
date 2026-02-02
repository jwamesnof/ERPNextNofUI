"use client"

import React, { useState } from "react"
import { format, parseISO } from "date-fns"
import { Copy, Check, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { PromiseResponse } from "@/lib/api/otpClient"

interface CustomerMessageCardProps {
  result: PromiseResponse
}

export function CustomerMessageCard({ result }: CustomerMessageCardProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const safeFormatDate = (date: string | null, fmt: string, fallback = "N/A") => {
    if (!date) return fallback
    try {
      return format(parseISO(date), fmt)
    } catch {
      return fallback
    }
  }

  const promiseDate = safeFormatDate(result.promise_date, "MMMM dd, yyyy")

  const generateMessage = () => {
    const confidenceText =
      result.confidence === "HIGH"
        ? "We are highly confident"
        : result.confidence === "MEDIUM"
          ? "We are fairly confident"
          : "We have some concerns"

    const topDriver = result.reasons?.[0] || "based on current inventory and supply availability"

    return `Dear Valued Customer,

We can deliver your order by ${promiseDate}.

${confidenceText} in meeting this commitment ${topDriver}.

Please reach out if you have any questions.

Best regards,
Order Management Team`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMessage())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Customer-ready Message</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-200">
          {/* Message Preview */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {generateMessage()}
            </pre>
          </div>

          {/* Actions */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Message
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
