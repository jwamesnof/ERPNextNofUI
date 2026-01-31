"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { clsx } from "clsx"

interface CopyButtonProps {
  value: string
  label?: string
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="button-secondary text-sm"
      title={label || "Copy"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          {label || "Copy"}
        </>
      )}
    </button>
  )
}
