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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { useAuth } from "~/context/auth.context"
import { apiClient } from "~/lib/api"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { format, subDays } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

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

type TimeRange = "7" | "30" | "90" | "all"

export default function Analytics() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>("30")
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
        const response = await apiClient.get("/session")
        const data = response.data || []
        setSessions(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch sessions:", err)
        setError("Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchSessions()
    }
  }, [isAuthenticated])

  // Filter sessions by time range
  useEffect(() => {
    let days: number | null = null

    if (timeRange === "7") days = 7
    else if (timeRange === "30") days = 30
    else if (timeRange === "90") days = 90

    const filtered = sessions.filter((session) => {
      if (days === null) return true
      const sessionDate = new Date(session.startTime)
      const cutoffDate = subDays(new Date(), days)
      return sessionDate >= cutoffDate
    })

    setFilteredSessions(filtered)
  }, [timeRange, sessions])

  if (isLoading || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Calculate metrics
  const totalSessions = filteredSessions.length
  const totalGames = filteredSessions.reduce(
    (sum, s) => sum + (s.gameEntries?.length || 0),
    0
  )
  const avgMood =
    filteredSessions.length > 0
      ? Math.round(
          filteredSessions.reduce(
            (sum, s) => sum + (s.moodEnd || s.moodStart),
            0
          ) / filteredSessions.length
        )
      : 0

  const avgTilt =
    filteredSessions.length > 0
      ? Math.round(
          filteredSessions.reduce((sum, s) => sum + s.tiltScore, 0) /
            filteredSessions.length
        )
      : 0

  const wins = filteredSessions.reduce(
    (sum, s) =>
      sum +
      (s.gameEntries?.filter((g) => g.result === "WIN").length || 0),
    0
  )
  const losses = filteredSessions.reduce(
    (sum, s) =>
      sum +
      (s.gameEntries?.filter((g) => g.result === "LOSS").length || 0),
    0
  )
  const draws = filteredSessions.reduce(
    (sum, s) =>
      sum +
      (s.gameEntries?.filter((g) => g.result === "DRAW").length || 0),
    0
  )

  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  // Prepare chart data
  const trendData = filteredSessions
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .map((s) => ({
      date: format(new Date(s.startTime), "MMM dd"),
      mood: s.moodEnd || s.moodStart,
      tilt: s.tiltScore,
      games: s.gameEntries?.length || 0,
    }))

  const gameStats = (() => {
    const map: {
      [key: string]: { wins: number; losses: number; draws: number }
    } = {}
    filteredSessions.forEach((s) => {
      s.gameEntries?.forEach((g) => {
        if (!map[g.gameName]) {
          map[g.gameName] = { wins: 0, losses: 0, draws: 0 }
        }
        if (g.result === "WIN") map[g.gameName].wins++
        else if (g.result === "LOSS") map[g.gameName].losses++
        else map[g.gameName].draws++
      })
    })

    return Object.entries(map)
      .map(([name, stats]) => ({
        name,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        total: stats.wins + stats.losses + stats.draws,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  })()

  const moodDistribution = [
    {
      name: "Very Negative (1-3)",
      value: filteredSessions.filter((s) => (s.moodEnd || s.moodStart) <= 3)
        .length,
      fill: "#ef4444",
    },
    {
      name: "Negative (4-5)",
      value: filteredSessions.filter(
        (s) =>
          (s.moodEnd || s.moodStart) >= 4 &&
          (s.moodEnd || s.moodStart) <= 5
      ).length,
      fill: "#f59e0b",
    },
    {
      name: "Neutral (6)",
      value: filteredSessions.filter((s) => (s.moodEnd || s.moodStart) === 6)
        .length,
      fill: "#f3f4f6",
    },
    {
      name: "Positive (7-8)",
      value: filteredSessions.filter(
        (s) =>
          (s.moodEnd || s.moodStart) >= 7 &&
          (s.moodEnd || s.moodStart) <= 8
      ).length,
      fill: "#60a5fa",
    },
    {
      name: "Very Positive (9-10)",
      value: filteredSessions.filter((s) => (s.moodEnd || s.moodStart) >= 9)
        .length,
      fill: "#10b981",
    },
  ].filter((item) => item.value > 0)

  const resultDistribution = [
    { name: "Wins", value: wins, fill: "#10b981" },
    { name: "Losses", value: losses, fill: "#ef4444" },
    { name: "Draws", value: draws, fill: "#f59e0b" },
  ].filter((item) => item.value > 0)

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
            <a href="/analytics" className="font-medium text-foreground">
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
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Deep dive into your gaming statistics and trends
            </p>
          </div>

          {/* Time Range Filter */}
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Card className="mb-8 border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">gaming sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGames}</div>
              <p className="text-xs text-muted-foreground">total games</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgMood}/10</div>
              <p className="text-xs text-muted-foreground">ending mood</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Tilt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgTilt}/10</div>
              <p className="text-xs text-muted-foreground">average tilt</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate}%</div>
              <p className="text-xs text-muted-foreground">win percentage</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="trends" className="mb-8">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
          </TabsList>

          {/* Trends Chart */}
          <TabsContent value="trends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood & Tilt Over Time</CardTitle>
                <CardDescription>
                  Track how your mood and tilt levels change throughout the period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Mood"
                      />
                      <Line
                        type="monotone"
                        dataKey="tilt"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Tilt"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available for this time range
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Distribution */}
          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Results Distribution</CardTitle>
                <CardDescription>
                  Your overall wins, losses, and draws
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resultDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={resultDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resultDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No game data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Games Performance */}
          <TabsContent value="games" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Games Performance</CardTitle>
                <CardDescription>
                  Your most played games and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gameStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gameStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="wins" stackId="a" fill="#10b981" name="Wins" />
                      <Bar dataKey="losses" stackId="a" fill="#ef4444" name="Losses" />
                      <Bar dataKey="draws" stackId="a" fill="#f59e0b" name="Draws" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No game data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mood Distribution */}
          <TabsContent value="mood" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
                <CardDescription>
                  How often you end sessions in different moods
                </CardDescription>
              </CardHeader>
              <CardContent>
                {moodDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {moodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No mood data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Insights */}
        {filteredSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <p className="font-medium">Session Activity</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve completed {totalSessions} sessions with an average of{" "}
                    {(totalGames / totalSessions).toFixed(1)} games per session.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">😊</div>
                <div>
                  <p className="font-medium">Mood Trend</p>
                  <p className="text-sm text-muted-foreground">
                    Your average ending mood is {avgMood}/10. Keep tracking to see patterns!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎮</div>
                <div>
                  <p className="font-medium">Performance</p>
                  <p className="text-sm text-muted-foreground">
                    Your win rate is {winRate}% across {totalGames} games. Focus on your top
                    games to improve!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
