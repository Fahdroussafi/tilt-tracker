import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("sessions", "routes/sessions.tsx"),
  route("sessions/new", "routes/sessions.new.tsx"),
  route("sessions/:id", "routes/sessions.$id.tsx"),
  route("analytics", "routes/analytics.tsx"),
  route("profile", "routes/profile.tsx"),
] satisfies RouteConfig
