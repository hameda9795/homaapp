import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Briefcase, 
  Search, 
  Mail, 
  FileText, 
  Send, 
  CheckCircle2,
  ArrowRight 
} from "lucide-react"

export default function Home() {
  return (
    <div className="container py-10">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Automate Your Job Search with{" "}
          <span className="text-primary">AI</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Connect your Gmail, upload your resume, and let our AI find jobs and send 
          personalized applications in Dutch automatically.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/signin">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <Card>
          <CardHeader>
            <Search className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Smart Job Search</CardTitle>
            <CardDescription>
              Automatically search LinkedIn and Indeed for jobs matching your criteria
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Mail className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Find HR Contacts</CardTitle>
            <CardDescription>
              Automatically scrape company websites to find HR email addresses
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle>AI Cover Letters</CardTitle>
            <CardDescription>
              Generate personalized cover letters in Dutch using GPT-4o
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Send className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Auto Send</CardTitle>
            <CardDescription>
              Send applications directly from your Gmail account
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Track Progress</CardTitle>
            <CardDescription>
              Monitor all your applications in a comprehensive dashboard
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Briefcase className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Daily Limits</CardTitle>
            <CardDescription>
              Set daily job limits to control your application volume
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* How It Works */}
      <div className="bg-muted rounded-lg p-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Connect Gmail</h3>
            <p className="text-sm text-muted-foreground">
              Sign in with Google and authorize Gmail access
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Set Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Upload resume and set your job preferences
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">AI Processing</h3>
            <p className="text-sm text-muted-foreground">
              Our AI finds jobs, finds contacts, and writes cover letters
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Review & Send</h3>
            <p className="text-sm text-muted-foreground">
              Review generated applications and send with one click
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
