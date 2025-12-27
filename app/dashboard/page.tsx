import { redirect } from "next/navigation"

/**
 * Dashboard Root Page
 * 
 * Redirects to the home tab by default.
 * The actual content is in /dashboard/home
 */

export default function DashboardPage() {
  redirect('/dashboard/home')
}
