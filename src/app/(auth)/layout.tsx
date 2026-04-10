"use client"

import { NextAuthProvider } from "@/providers/next-auth"
import { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <NextAuthProvider>
      {children}
    </NextAuthProvider>
  )
}
