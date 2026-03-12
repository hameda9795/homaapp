"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Upload, Briefcase, MapPin, Languages, Mail, Settings, CheckCircle2 } from "lucide-react"

const DAILY_LIMITS = [5, 10, 20, 50, 70, 100]

export default function Onboarding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    resume: null as File | null,
    jobTitles: "",
    education: "",
    location: "",
    languages: "",
    sources: [] as string[],
    dailyJobLimit: 10,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const data = new FormData()
      if (formData.resume) {
        data.append("resume", formData.resume)
      }
      data.append("jobTitles", formData.jobTitles)
      data.append("education", formData.education)
      data.append("location", formData.location)
      data.append("languages", formData.languages)
      data.append("sources", JSON.stringify(formData.sources))
      data.append("dailyJobLimit", formData.dailyJobLimit.toString())

      const response = await fetch("/api/profile", {
        method: "POST",
        body: data,
      })

      if (response.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Let&apos;s set up your job search preferences
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Progress value={progress} className="mb-6" />

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Upload Your Resume</h3>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume"
                />
                <Label htmlFor="resume" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {formData.resume ? formData.resume.name : "Click to upload PDF or DOCX"}
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Job Preferences</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitles">Job Titles (comma separated)</Label>
                <Input
                  id="jobTitles"
                  placeholder="e.g. Software Engineer, Frontend Developer"
                  value={formData.jobTitles}
                  onChange={(e) => setFormData({ ...formData, jobTitles: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  placeholder="e.g. Bachelor in Computer Science"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Location & Languages</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Preferred Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Amsterdam, Netherlands"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma separated)</Label>
                <Input
                  id="languages"
                  placeholder="e.g. Dutch, English"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Job Sources</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Select where to search for jobs:
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="linkedin"
                    checked={formData.sources.includes("LINKEDIN")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, sources: [...formData.sources, "LINKEDIN"] })
                      } else {
                        setFormData({ ...formData, sources: formData.sources.filter(s => s !== "LINKEDIN") })
                      }
                    }}
                  />
                  <Label htmlFor="linkedin">LinkedIn</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="indeed"
                    checked={formData.sources.includes("INDEED")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, sources: [...formData.sources, "INDEED"] })
                      } else {
                        setFormData({ ...formData, sources: formData.sources.filter(s => s !== "INDEED") })
                      }
                    }}
                  />
                  <Label htmlFor="indeed">Indeed</Label>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Daily Job Limit</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                How many jobs should we process per day?
              </p>
              <Select
                value={formData.dailyJobLimit.toString()}
                onValueChange={(value) => setFormData({ ...formData, dailyJobLimit: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAILY_LIMITS.map((limit) => (
                    <SelectItem key={limit} value={limit.toString()}>
                      {limit} jobs per day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Complete Setup"}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
