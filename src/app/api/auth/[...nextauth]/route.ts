import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async signIn({ user, account, profile }) {
      console.log("=== SIGN IN CALLBACK ===")
      console.log("User:", user)
      console.log("Account:", account)
      console.log("Profile:", profile)
      
      try {
        const result = await authOptions.callbacks?.signIn?.({ user, account, profile } as any)
        console.log("SignIn result:", result)
        return result ?? true
      } catch (error) {
        console.error("SignIn error:", error)
        return false
      }
    },
  },
  events: {
    async signIn(message) {
      console.log("=== EVENT: SIGN IN ===", message)
    },
    async error(message) {
      console.error("=== EVENT: ERROR ===", message)
    },
  },
})

export { handler as GET, handler as POST }
