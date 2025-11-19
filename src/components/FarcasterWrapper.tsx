"use client"
import React from "react"

export default function FarcasterWrapper({ children }: { children: React.ReactNode }) {
  // Minimal wrapper to keep tree stable without altering UI/behavior.
  return <>{children}</>
}
