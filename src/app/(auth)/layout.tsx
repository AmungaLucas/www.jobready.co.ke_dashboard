"use client"

import { ReactNode, Suspense } from "react"
import { NextAuthProvider } from "@/providers/next-auth"

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <NextAuthProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }>
        {children}
      </Suspense>
    </NextAuthProvider>
  )
}
