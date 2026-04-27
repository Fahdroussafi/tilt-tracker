import { Link, useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { useAuth } from "~/context/auth.context"
import { useLogout } from "~/hooks/use-auth"

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/login"),
    })
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
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

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                Hi,{" "}
                <span className="font-medium text-foreground">
                  {user?.username || user?.email}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                {logout.isPending ? "Logging out..." : "Logout"}
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
          <div>
            <h1 className="text-2xl font-bold">Project ready!</h1>
            <p className="text-muted-foreground">
              You may now add components and start building.
            </p>

            <Card className="mt-6 max-w-sm">
              <CardHeader>
                <CardTitle>Auth Status</CardTitle>
                <CardDescription>
                  {isAuthenticated
                    ? "You are currently logged in."
                    : "You are browsing as a guest."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <pre className="mt-2 rounded-md bg-muted p-4 text-xs">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                ) : (
                  "Your design system is ready. Start building your next component."
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
