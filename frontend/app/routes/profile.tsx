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
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { useAuth } from "~/context/auth.context"
import { useLogout } from "~/hooks/use-auth"
import { apiClient } from "~/lib/api"
import { User, Lock, LogOut, Trash2 } from "lucide-react"

interface UserStats {
  totalSessions: number
  totalGames: number
  avgMood: number
  avgTilt: number
}

export default function Profile() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()

  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalGames: 0,
    avgMood: 0,
    avgTilt: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true)
        const [sessionsRes] = await Promise.all([
          apiClient.get("/session"),
        ])

        const sessions = sessionsRes.data || []

        const totalSessions = sessions.length
        const totalGames = sessions.reduce(
          (sum: number, s: any) => sum + (s.gameEntries?.length || 0),
          0
        )
        const avgMood =
          sessions.length > 0
            ? Math.round(
                sessions.reduce((sum: number, s: any) => sum + (s.moodEnd || s.moodStart), 0) /
                  sessions.length
              )
            : 0
        const avgTilt =
          sessions.length > 0
            ? Math.round(
                sessions.reduce((sum: number, s: any) => sum + s.tiltScore, 0) /
                  sessions.length
              )
            : 0

        setStats({ totalSessions, totalGames, avgMood, avgTilt })
        setError(null)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setError("Failed to load your statistics")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchUserStats()
    }
  }, [isAuthenticated])

  const handleChangePassword = async () => {
    setPasswordError(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters")
      return
    }

    try {
      setIsChangingPassword(true)
      await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      })

      setSuccessMessage("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordDialog(false)

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password"
      )
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      alert('Please type "DELETE" to confirm account deletion')
      return
    }

    try {
      setIsDeletingAccount(true)
      await apiClient.delete("/auth/account")

      logout.mutate(undefined, {
        onSuccess: () => navigate("/login"),
      })
    } catch (err: any) {
      console.error("Failed to delete account:", err)
      alert(err.response?.data?.message || "Failed to delete account")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/login"),
    })
  }

  if (isLoading || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
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
            <a href="/profile" className="font-medium text-foreground">
              Profile
            </a>
          </nav>

          <Button asChild>
            <a href="/sessions/new">Start Session</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {error && (
          <Card className="mb-8 border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="mb-8 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-700">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Account Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="font-medium text-lg">{user?.email || "N/A"}</p>
            </div>
            {user?.username && (
              <div>
                <Label className="text-muted-foreground text-sm">Username</Label>
                <p className="font-medium text-lg">{user.username}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-sm">Member Since</Label>
              <p className="font-medium text-lg">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Statistics</CardTitle>
            <CardDescription>An overview of your gaming activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="border rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Sessions</p>
                <p className="text-3xl font-bold">{stats.totalSessions}</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Games</p>
                <p className="text-3xl font-bold">{stats.totalGames}</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">Average Mood</p>
                <p className="text-3xl font-bold">{stats.avgMood}/10</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-sm mb-1">Average Tilt</p>
                <p className="text-3xl font-bold">{stats.avgTilt}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(true)}
              className="w-full sm:w-auto"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>Manage your account sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logout.isPending ? "Signing out..." : "Sign Out"}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500 mb-6">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and your new password
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {passwordError && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                <p className="text-red-700 text-sm">{passwordError}</p>
              </div>
            )}

            <div>
              <Label htmlFor="current" className="font-semibold">
                Current Password
              </Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="new" className="font-semibold">
                New Password
              </Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirm" className="font-semibold">
                Confirm New Password
              </Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                To confirm, type <span className="font-bold">DELETE</span> below
              </p>
            </div>

            <Input
              placeholder='Type "DELETE" to confirm'
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmation("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmation !== "DELETE"}
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
