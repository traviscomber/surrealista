import { APP_TIME_ZONE } from "@/lib/timezone"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = APP_TIME_ZONE
  }
}
