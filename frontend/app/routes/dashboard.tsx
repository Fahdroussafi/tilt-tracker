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
import { Activity, Flame, Trophy, Zap } from "lucide-react"

interface Session {
  id: string
  startTime: string
  endTime: string
  moodStart: number
  moodEnd: number
  tiltScore: number
  gameEntries: GameEntry[]
}

interface GameEntry {
  id: string
  gameName: string
  result: "WIN" | "LOSS" | "DRAW"
  tiltLevel: number
}

interface DashboardStats {
  totalSessions: number
  avgTilt: number
  winRate: number
  currentStreak: number
  recentSessions: Session[]
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [gameStats, setGameStats] = useState<any[]>([])
  const [moodTrend, setMoodTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [sessionsRes] = await Promise.all([
          apiClient.get("/session"),
        ])

        const sessions = sessionsRes.data || []

        // Calculate stats
        const totalSessions = sessions.length
        const avgTilt =
          sessions.length > 0
            ? Math.round(
                sessions.reduce((sum: number, s: Session) => sum + s.tiltScore, 0) /
                  sessions.length
              )
            : 0

        const totalGames = sessions.reduce(
          (sum: number, s: Session) => sum + (s.gameEntries?.length || 0),
          0
        )
        const wins = sessions.reduce(
          (sum: number, s: Session) =>
            sum +
            (s.gameEntries?.filter((g: GameEntry) => g.result === "WIN").length ||
              0),
          0
        )
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

        // Calculate current streak
        const sortedSessions = [...sessions].sort(
          (a: Session, b: Session) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
        let currentStreak = 0
        for (const session of sortedSessions) {
          const wins = session.gameEntries?.filter(
            (g: GameEntry) => g.result === "WIN"
          ).length
          if (wins && wins > 0) {
            currentStreak++
          } else {
            break
          }
        }

        setStats({
          totalSessions,
          avgTilt,
          winRate,
          currentStreak,
          recentSessions: sortedSessions.slice(0, 5),
        })

        // Prepare chart data - last 7 sessions
        const last7 = sortedSessions.slice(0, 7).reverse()
        setChartData(
          last7.map((s: Session) => ({
            date: format(new Date(s.startTime), "MMM dd"),
            tilt: s.tiltScore,
            moodStart: s.moodStart,
            moodEnd: s.moodEnd,
          }))
        )

        // Game stats
        const gameMap: { [key: string]: { wins: number; losses: number } } = {}
        sessions.forEach((s: Session) => {
          s.gameEntries?.forEach((g: GameEntry) => {
            if (!gameMap[g.gameName]) {
              gameMap[g.gameName] = { wins: 0, losses: 0 }
            }
            if (g.result === "WIN") {
              gameMap[g.gameName].wins++
            } else {
              gameMap[g.gameName].losses++
            }
          })
        })

        setGameStats(
          Object.entries(gameMap)
            .map(([name, stats]) => ({
              name,
              wins: stats.wins,
              losses: stats.losses,
            }))
            .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
            .slice(0, 5)
        )

        // Mood trend
        setMoodTrend([
          { name: "Positive", value: sessions.filter((s: Session) => s.moodEnd > 6).length, fill: "#10b981" },
          { name: "Neutral", value: sessions.filter((s: Session) => s.moodEnd >= 4 && s.moodEnd <= 6).length, fill: "#f59e0b" },
          { name: "Negative", value: sessions.filter((s: Session) => s.moodEnd < 4).length, fill: "#ef4444" },
        ])

        setError(null)
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated])

  if (isLoading || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

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
            <a href="/dashboard" className="font-medium text-foreground">
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

          <Button asChild>
            <a href="/sessions/new">Start Session</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your gaming overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
              <p className="text-xs text-muted-foreground">Gaming sessions tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Tilt</CardTitle>
              <Flame className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgTilt || 0}/10</div>
              <p className="text-xs text-muted-foreground">Across all sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.winRate || 0}%</div>
              <p className="text-xs text-muted-foreground">Overall win percentage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Winning Streak</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.currentStreak || 0}</div>
              <p className="text-xs text-muted-foreground">Current consecutive wins</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="trends" className="mb-8">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="mood">Mood Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tilt & Mood Trends (Last 7 Sessions)</CardTitle>
                <CardDescription>Track how your mood and tilt evolve over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="tilt"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Tilt Score"
                      />
                      <Line
                        type="monotone"
                        dataKey="moodStart"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Mood Start"
                      />
                      <Line
                        type="monotone"
                        dataKey="moodEnd"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Mood End"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available yet. Start a session to see trends.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Games Performance</CardTitle>
                <CardDescription>Your most played games and their results</CardDescription>
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
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No game data available yet. Log some games to see statistics.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mood" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
                <CardDescription>How often you end sessions in different moods</CardDescription>
              </CardHeader>
              <CardContent>
                {moodTrend.some((m) => m.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={moodTrend}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {moodTrend.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No mood data available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest gaming activity</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentSessions && stats.recentSessions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {format(new Date(session.startTime), "MMM dd, yyyy HH:mm")}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          Mood: {session.moodEnd}/10
                        </Badge>
                        <Badge
                          variant={session.tiltScore > 6 ? "destructive" : "secondary"}
                        >
                          Tilt: {session.tiltScore}/10
                        </Badge>
                        <Badge variant="outline">
                          Games: {session.gameEntries?.length || 0}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <a href={`/sessions/${session.id}`}>View</a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sessions yet. Start your first gaming session!</p>
                <Button className="mt-4" asChild>
                  <a href="/sessions/new">Start Session</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
