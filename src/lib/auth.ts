import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) return null
        if (user.role !== 'ADMIN') return null

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) return null

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  // Fix: Don't hardcode cookie domain — let NextAuth use the current request domain.
  // This ensures cookies work on any domain (Vercel default, custom domain, localhost, etc.)
  cookies: {
    sessionToken: {
      name: `${process.env.NEXTAUTH_COOKIE_NAME || 'next-auth'}-session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NEXTAUTH_COOKIE_NAME || 'next-auth'}-callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NEXTAUTH_COOKIE_NAME || 'next-auth'}-csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `${process.env.NEXTAUTH_COOKIE_NAME || 'next-auth'}-pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: `${process.env.NEXTAUTH_COOKIE_NAME || 'next-auth'}-state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || 'JOB_SEEKER'
      }
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string
        (session.user as { role?: string }).role = token.role as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const existingUser = await db.user.findUnique({
          where: { email: user.email || '' },
        })
        if (!existingUser || existingUser.role !== 'ADMIN') return false
        await db.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date() },
        })
        ;(user as { id?: string }).id = existingUser.id
        ;(user as { role?: string }).role = existingUser.role
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
  // Don't hardcode NEXTAUTH_URL — use request headers at runtime
  secret: process.env.NEXTAUTH_SECRET,
}
