"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

const errors: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "Access denied. You do not have permission to sign in.",
  Verification: "The verification token has expired or is invalid.",
  OAuthSignin: "Error in the OAuth sign-in process.",
  OAuthCallback: "Error in the OAuth callback process.",
  OAuthCreateAccount: "Could not create OAuth provider account.",
  EmailCreateAccount: "Could not create email provider account.",
  Callback: "Error in the OAuth callback handler.",
  OAuthAccountNotLinked: "Email already exists with different provider.",
  EmailSignin: "Error sending the email.",
  CredentialsSignin: "Invalid credentials.",
  SessionRequired: "Please sign in to access this page.",
  Default: "An unknown error occurred.",
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription className="text-destructive font-medium mt-2">
          {error ? errors[error] || errors.Default : errors.Default}
        </CardDescription>
        {error && (
          <p className="text-xs text-muted-foreground mt-2">
            Error code: {error}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Link href="/auth/signin">
          <Button className="w-full">Try Again</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full">Go Home</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function AuthError() {
  return (
    <div className="container flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  )
}
