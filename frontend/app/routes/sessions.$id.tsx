import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { useAuth } from "~/context/auth.context"
import { apiClient } from "~/lib/api"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Trash2 } from "lucide-react"

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

interface Session {
  id: string
  startTime: string
  endTime: string | null
  moodStart: number
  moodEnd: number | null
  tiltScore: number
  gameEntries: GameEntry[]
  notes?: string
}

interface GameEntry {
  id: string
  gameName: string
  result: "WIN" | "LOSS" | "DRAW"
  tiltLevel: number
  notes?: string
}

export default function SessionDetail() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEndingSession, setIsEndingSession] = useState(false)
  const [endMood, setEndMood] = useState(5)
  const [showEndForm, setShowEndForm] = useState(false)

  // Game form state
  const [showGameForm, setShowGameForm] = useState(false)
  const [gameName, setGameName] = useState("")
  const [gameResult, setGameResult] = useState<"WIN" | "LOSS" | "DRAW">("WIN")
  const [tiltLevel, setTiltLevel] = useState(5)
  const [gameNotes, setGameNotes] = useState("")
  const [isAddingGame, setIsAddingGame] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/session/${id}`)
        setSession(response.data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch session:", err)
        setError("Failed to load session")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && id) {
      fetchSession()
    }
  }, [isAuthenticated, id])

  const handleAddGame = async () => {
    if (!gameName.trim()) {
      alert("Please enter a game name")
      return
    }

    try {
      setIsAddingGame(true)
      const response = await apiClient.post(`/game-entry`, {
        sessionId: id,
        gameName,
        result: gameResult,
        tiltLevel,
        notes: gameNotes,
      })

      if (session) {
        setSession({
          ...session,
          gameEntries: [...session.gameEntries, response.data],
        })
      }

      // Reset form
      setGameName("")
      setGameResult("WIN")
      setTiltLevel(5)
      setGameNotes("")
      setShowGameForm(false)
    } catch (err: any) {
      console.error("Failed to add game:", err)
      alert(err.response?.data?.message || "Failed to add game")
    } finally {
      setIsAddingGame(false)
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm("Are you sure you want to delete this game?")) {
      return
    }

    try {
      await apiClient.delete(`/game-entry/${gameId}`)

      if (session) {
        setSession({
          ...session,
          gameEntries: session.gameEntries.filter((g) => g.id !== gameId),
        })
      }
    } catch (err) {
      console.error("Failed to delete game:", err)
      alert("Failed to delete game")
    }
  }

  const handleEndSession = async () => {
    try {
      setIsEndingSession(true)
      const response = await apiClient.patch(`/session/${id}`, {
        moodEnd: endMood,
        endTime: new Date().toISOString(),
      })

      setSession(response.data)
      setShowEndForm(false)
    } catch (err: any) {
      console.error("Failed to end session:", err)
      alert(err.response?.data?.message || "Failed to end session")
    } finally {
      setIsEndingSession(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error || "Session not found"}</p>
            <Button onClick={() => navigate("/sessions")} className="mt-4">
              Back to Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSessionEnded = session.endTime !== null

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
            <a href="/sessions">Back</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {format(new Date(session.startTime), "EEEE, MMMM dd, yyyy")}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(session.startTime), "h:mm a")} -{" "}
            {isSessionEnded
              ? format(new Date(session.endTime!), "h:mm a")
              : "Ongoing"}
          </p>
        </div>

        {/* Session Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Starting Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-1">{MOOD_EMOJIS[session.moodStart]}</div>
              <p className="text-2xl font-bold">{session.moodStart}/10</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ending Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-1">
                {session.moodEnd ? MOOD_EMOJIS[session.moodEnd] : "?"}
              </div>
              <p className="text-2xl font-bold">
                {session.moodEnd ? `${session.moodEnd}/10` : "Not set"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tilt Score</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={
                  session.tiltScore > 6
                    ? "bg-red-100 text-red-800 text-lg py-1 px-2"
                    : "bg-green-100 text-green-800 text-lg py-1 px-2"
                }
              >
                {session.tiltScore}/10
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="games">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="games">Games ({session.gameEntries.length})</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.notes && (
                  <div>
                    <Label className="font-semibold">Notes</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {session.notes}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="font-semibold">Status</Label>
                  <div className="mt-1">
                    {isSessionEnded ? (
                      <Badge className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>

                {!isSessionEnded && (
                  <div className="pt-4">
                    {!showEndForm ? (
                      <Button onClick={() => setShowEndForm(true)}>
                        End Session
                      </Button>
                    ) : (
                      <Card className="bg-muted/50 border-dashed">
                        <CardHeader>
                          <CardTitle className="text-lg">End Session</CardTitle>
                          <CardDescription>
                            How are you feeling now?
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="text-center mb-4">
                              <div className="text-5xl mb-2">
                                {MOOD_EMOJIS[endMood]}
                              </div>
                              <p className="text-xl font-bold">{endMood}/10</p>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={endMood}
                              onChange={(e) =>
                                setEndMood(parseInt(e.target.value))
                              }
                              className="w-full"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleEndSession}
                              disabled={isEndingSession}
                              className="flex-1"
                            >
                              {isEndingSession ? "Saving..." : "End Session"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowEndForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="mt-6 space-y-6">
            {/* Games List */}
            {session.gameEntries.length > 0 && (
              <div className="space-y-4">
                {session.gameEntries.map((game) => (
                  <Card key={game.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{game.gameName}</CardTitle>
                          <CardDescription>
                            Result: {game.result}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className={
                              game.result === "WIN"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {game.result}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGame(game.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Tilt Level
                        </p>
                        <p className="font-bold">{game.tiltLevel}/10</p>
                      </div>
                      {game.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm">{game.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Game Form */}
            {!showGameForm ? (
              <Button onClick={() => setShowGameForm(true)} className="w-full">
                Add Game Entry
              </Button>
            ) : (
              <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                  <CardTitle>Add Game</CardTitle>
                  <CardDescription>
                    Log a game you played during this session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="gameName" className="font-semibold">
                      Game Name
                    </Label>
                    <Input
                      id="gameName"
                      placeholder="e.g., League of Legends, Valorant, CS:GO"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="result" className="font-semibold">
                      Result
                    </Label>
                    <Select value={gameResult} onValueChange={(v: any) => setGameResult(v)}>
                      <SelectTrigger id="result" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WIN">Win</SelectItem>
                        <SelectItem value="LOSS">Loss</SelectItem>
                        <SelectItem value="DRAW">Draw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tilt" className="font-semibold">
                      Tilt Level: {tiltLevel}/10
                    </Label>
                    <input
                      id="tilt"
                      type="range"
                      min="1"
                      max="10"
                      value={tiltLevel}
                      onChange={(e) => setTiltLevel(parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="font-semibold">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this game..."
                      value={gameNotes}
                      onChange={(e) => setGameNotes(e.target.value)}
                      className="mt-1 min-h-24"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddGame}
                      disabled={isAddingGame}
                      className="flex-1"
                    >
                      {isAddingGame ? "Adding..." : "Add Game"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowGameForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {session.gameEntries.length === 0 && !showGameForm && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No games logged yet. Add your first game entry!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
