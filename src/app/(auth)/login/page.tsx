"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { siteConfig, brandInitials } from "@/config/site-config"

function LoginCard() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const errorParam = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (errorParam === "CredentialsSignin") {
      setError("Invalid email or password. Admin access only.")
    } else if (errorParam) {
      setError("An error occurred during sign in.")
    }
  }, [errorParam])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    /*
     * KEY: redirect: true means NextAuth does a FULL server-side flow:
     *   1. POST /api/auth/callback/credentials → validates creds
     *   2. Server sets the session cookie in the HTTP response
     *   3. Server returns a 302 redirect to callbackUrl
     *
     * The browser CANNOT navigate to callbackUrl without first accepting
     * the Set-Cookie header (HTTP spec). This eliminates ALL race
     * conditions on every device — desktop, mobile, Safari ITP, etc.
     *
     * On failure, NextAuth redirects to: /login?error=CredentialsSignin
     * which we catch above via useSearchParams.
     */
    signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: true,
    })
  }

  const onGoogle = () => {
    setLoading(true)
    signIn("google", { callbackUrl, redirect: true })
  }

  const errorBanner = error
    ? (
      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        {error}
      </div>
    )
    : null

  const spinner = loading
    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    : null

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-white">Welcome back</CardTitle>
        <CardDescription className="text-slate-400">
          Sign in to access the admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorBanner}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={`admin@${siteConfig.companyDomain}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {spinner}
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800/50 px-2 text-slate-400">Or continue with</span>
            </div>
          </div>
          <Button
            variant="outline"
            type="button"
            onClick={onGoogle}
            disabled={loading}
            className="w-full mt-4 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700"
          >
            {loading ? spinner : null}
            Google
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Admin access only. Unauthorized access is prohibited.
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{brandInitials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{siteConfig.brandName}</h1>
              <p className="text-slate-400 text-sm">Admin Dashboard</p>
            </div>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          }
        >
          <LoginCard />
        </Suspense>
      </div>
    </div>
  )
}
