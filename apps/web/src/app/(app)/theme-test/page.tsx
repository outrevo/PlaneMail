'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme Test Page</h1>
          <p className="text-muted-foreground">Test the light and dark theme implementation</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Various button styles and states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-x-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <div className="space-x-2">
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Inputs and labels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Enter your email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input type="password" id="password" placeholder="Enter your password" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status and info badges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-x-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>CSS variable color swatches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="h-16 w-full bg-background border rounded mb-2"></div>
                <p className="text-sm">Background</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-full bg-foreground rounded mb-2"></div>
                <p className="text-sm">Foreground</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-full bg-primary rounded mb-2"></div>
                <p className="text-sm">Primary</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-full bg-secondary rounded mb-2"></div>
                <p className="text-sm">Secondary</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-full bg-muted rounded mb-2"></div>
                <p className="text-sm">Muted</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-full bg-accent rounded mb-2"></div>
                <p className="text-sm">Accent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
