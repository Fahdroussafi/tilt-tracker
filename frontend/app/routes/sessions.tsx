import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { useAuth } from "~/context/auth.context"
import { api } from "~/lib/api"
import { format } from "date-fns"
import { Search, Plus } from "lucide-react"

interface Session {
  id: string
  startTime: string
  endTime: string | null
  moodStart: number
  moodEnd: number | null
  tiltScore: number
  gameEntries: GameEntry[]
}

interface GameEntry {
  id: string
  gameName: string
  result: "WIN" | "LOSS" | "DRAW"
  tiltLevel: number
}

export default function Sessions() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const response = await api.get("/session")
        const data = response.data || []
        
        const sortedSessions = [...data].sort(
          (a: Session, b: Session) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
        
        setSessions(sortedSessions)
        setFilteredSessions(sortedSessions)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch sessions:", err)
        setError("Failed to load sessions")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchSessions()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const filtered = sessions.filter(
      (session) =>
        format(new Date(session.startTime), "MMM dd, yyyy").toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.gameEntries.some((g) =>
          g.gameName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    setFilteredSessions(filtered)
  }, [searchTerm, sessions])

  const getMoodColor = (mood: number | null): string => {
    if (mood === null) return "text-muted-foreground"
    if (mood <= 3) return "text-red-500"
    if (mood <= 5) return "text-yellow-500"
    if (mood <= 7) return "text-blue-500"
    return "text-green-500"
  }

  const getTiltColor = (tilt: number): string => {
    if (tilt <= 3) return "bg-green-100 text-green-800"
    if (tilt <= 6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (isLoading || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading sessions...</p>
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
            <a href="/sessions" className="font-medium text-foreground">
              Sessions
            </a>
            <a href="/analytics" className="text-muted-foreground hover:text-foreground">
              Analytics
            </a>
            <a href="/profile" className="text-muted-foreground hover:text-foreground">
              Profile
            </a>
          </nav>

          <Button asChild>
            <a href="/sessions/new">Start Session</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Gaming Sessions</h1>
          <p className="text-muted-foreground">Track and manage your gaming sessions</p>
        </div>

        {/* Search & CTA */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions by date or game..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild>
            <a href="/sessions/new" className="gap-2">
              <Plus className="h-4 w-4" />
              New Session
            </a>
          </Button>
        </div>

        {/* Sessions List */}
        {error && (
          <Card className="mb-8 border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {filteredSessions.length > 0 ? (
          <div className="grid gap-4">
            {filteredSessions.map((session) => {
              const winCount = session.gameEntries.filter(
                (g) => g.result === "WIN"
              ).length
              const lossCount = session.gameEntries.filter(
                (g) => g.result === "LOSS"
              ).length

              return (
                <Card
                  key={session.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {format(
                            new Date(session.startTime),
                            "EEEE, MMMM dd, yyyy"
                          )}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(session.startTime), "h:mm a")} -{" "}
                          {session.endTime
                            ? format(new Date(session.endTime), "h:mm a")
                            : "Ongoing"}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/sessions/${session.id}`)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {/* Mood Start */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Starting Mood
                        </p>
                        <div className={`text-2xl font-bold ${getMoodColor(session.moodStart)}`}>
                          {session.moodStart}/10
                        </div>
                      </div>

                      {/* Mood End */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Ending Mood
                        </p>
                        <div className={`text-2xl font-bold ${getMoodColor(session.moodEnd)}`}>
                          {session.moodEnd !== null ? `${session.moodEnd}/10` : "N/A"}
                        </div>
                      </div>

                      {/* Tilt Score */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Tilt Score
                        </p>
                        <Badge className={getTiltColor(session.tiltScore)}>
                          {session.tiltScore}/10
                        </Badge>
                      </div>

                      {/* Games */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Performance
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50">
                            W: {winCount}
                          </Badge>
                          <Badge variant="outline" className="bg-red-50">
                            L: {lossCount}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Games Preview */}
                    {session.gameEntries.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Games Played:</p>
                        <div className="flex flex-wrap gap-2">
                          {session.gameEntries.slice(0, 3).map((game) => (
                            <Badge
                              key={game.id}
                              variant="secondary"
                              className={
                                game.result === "WIN"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {game.gameName} ({game.result})
                            </Badge>
                          ))}
                          {session.gameEntries.length > 3 && (
                            <Badge variant="outline">
                              +{session.gameEntries.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-12">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No sessions found matching your search"
                    : "No sessions yet. Start your first gaming session!"}
                </p>
                <Button asChild>
                  <a href="/sessions/new">Start Your First Session</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
