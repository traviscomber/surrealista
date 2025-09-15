import { type NextRequest, NextResponse } from "next/server"
import { createAPIResponse, withErrorHandling, withAuth } from "../../../middleware"
import { SIIService } from "@/lib/services/integrations/government"

const siiService = new SIIService()

export const GET = withAuth(
  withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const rol = searchParams.get("rol")
    const action = searchParams.get("action") || "property"

    if (!rol) {
      return NextResponse.json(createAPIResponse(null, false, undefined, "ROL number is required"), {
        status: 400,
      })
    }

    let result
    switch (action) {
      case "property":
        result = await siiService.getPropertyByRol(rol)
        break
      case "contributions":
        result = await siiService.getContributions(rol)
        break
      case "transactions":
        result = await siiService.getTransactions(rol)
        break
      default:
        return NextResponse.json(createAPIResponse(null, false, undefined, "Invalid action"), {
          status: 400,
        })
    }

    return NextResponse.json(createAPIResponse(result))
  }),
)
