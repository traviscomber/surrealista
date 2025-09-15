import { type NextRequest, NextResponse } from "next/server"
import { createAPIResponse, withErrorHandling, withAuth } from "../../../middleware"
import { SIRENEService } from "@/lib/services/integrations/government"

const sireneService = new SIRENEService()

export const GET = withAuth(
  withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const rut = searchParams.get("rut")
    const name = searchParams.get("name")
    const comuna = searchParams.get("comuna")
    const giro = searchParams.get("giro")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (rut) {
      const result = await sireneService.getCompanyByRUT(rut)
      return NextResponse.json(createAPIResponse(result))
    }

    if (name || comuna || giro) {
      const filters = { ...(comuna && { comuna }), ...(giro && { giro }) }
      const result = await sireneService.searchRealEstateCompanies(filters, page, limit)
      return NextResponse.json(createAPIResponse(result))
    }

    return NextResponse.json(createAPIResponse(null, false, undefined, "At least one search parameter is required"), {
      status: 400,
    })
  }),
)
