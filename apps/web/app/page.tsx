import { redirect } from "next/navigation"

/**
 * Homepage - redirects to UI showcase for now
 * This will be replaced with the actual app homepage once development progresses
 */
export default function HomePage() {
  redirect("/ui-showcase")
}