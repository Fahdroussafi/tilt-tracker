import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { useAuth } from "~/context/auth.context"
import { apiClient } from "~/lib/api"
import { useEffect } from "react"

const MOOD_EMOJIS: { [key: number]: string } = {
  1: "😠",
  2: "😡",
  3: "😤",
  4: "😕",
  5: "😐",
  6: "🙂",
  7: "😊",
  8: "😄",
  9: "😃",
  10: "🤩",
}

export default function NewSession() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [mood, setMood] = useState(5)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleStartSession = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await apiClient.post("/session", {
        moodStart: mood,
        notes,
      })

      if (response.data?.id) {
        navigate(`/sessions/${response.data.id}`)
      } else {
        setError("Failed to create session. Please try again.")
      }
    } catch (err: any) {
      console.error("Failed to start session:", err)
      setError(err.response?.data?.message || "Failed to start session")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary-foreground"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight">Tilt Tracker</span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </a>
            <a href="/sessions" className="text-muted-foreground hover:text-foreground">
              Sessions
            </a>
            <a href="/analytics" className="text-muted-foreground hover:text-foreground">
              Analytics
            </a>
            <a href="/profile" className="text-muted-foreground hover:text-foreground">
              Profile
            </a>
          </nav>

          <Button variant="outline" asChild>
            <a href="/sessions">Cancel</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Start a New Session</h1>
          <p className="text-muted-foreground">
            Tell us how you&apos;re feeling before you start gaming
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gaming Session</CardTitle>
            <CardDescription>
              Set your starting mood and add any notes before playing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Mood Slider */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="mood" className="text-base font-semibold">
                  How are you feeling right now?
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Rate your mood on a scale of 1 (very angry) to 10 (extremely happy)
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">{MOOD_EMOJIS[mood]}</div>
                  <p className="text-2xl font-bold">{mood}/10</p>
                </div>

                <input
                  id="mood"
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Very Angry</span>
                  <span>Neutral</span>
                  <span>Very Happy</span>
                </div>
              </div>

              {/* Mood Labels */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div>😠</div>
                <div>😡</div>
                <div>😐</div>
                <div>😊</div>
                <div>🤩</div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="font-semibold">
                Session Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about your gaming session, games you plan to play, or anything else on your mind..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-32"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                onClick={handleStartSession}
                disabled={isSubmitting}
                size="lg"
                className="flex-1"
              >
                {isSubmitting ? "Starting..." : "Start Session"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
              >
                <a href="/sessions">Cancel</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
