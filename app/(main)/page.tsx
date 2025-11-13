import { redirect } from "next/navigation"

export default function HomePage() {
  // Server-side redirect - no client components load
  redirect("/busqueda")
}
