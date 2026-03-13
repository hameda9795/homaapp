import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth({
  ...authOptions,
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
