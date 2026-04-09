"use client"

import { ReactNode } from "react"
import { NextAuthProvider } from "@/providers/next-auth"

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <NextAuthProvider>{children}</NextAuthProvider>
}
