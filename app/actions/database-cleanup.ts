"use server"

import { createClient } from "@/lib/supabase/server"

export async function cleanupDatabase(tables: string[]) {
  const supabase = await createClient()

  try {
    const deletedCounts: Record<string, number> = {}

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all except impossible ID
        .select("id", { count: "exact", head: true })

      if (error) {
        console.error(`Error deleting from ${table}:`, error)
        return {
          success: false,
          message: `Error al limpiar tabla ${table}: ${error.message}`,
        }
      }

      deletedCounts[table] = count || 0
    }

    return {
      success: true,
      message: `Base de datos limpiada exitosamente`,
      deletedCounts,
    }
  } catch (error) {
    console.error("Database cleanup error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido al limpiar la base de datos",
    }
  }
}
