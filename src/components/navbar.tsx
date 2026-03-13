"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, Sun, Moon, LayoutDashboard, Search } from "lucide-react"
import { useTheme } from "next-themes"

export function Navbar() {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6" />
          <span className="font-bold text-xl">JobAuto</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link href="/step1">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search Jobs
            </Button>
          </Link>
          
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  )
}
