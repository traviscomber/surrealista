type DynamicRow = any

type DynamicTable = {
  Row: DynamicRow
  Insert: DynamicRow
  Update: DynamicRow
  Relationships: any[]
}

/**
 * Structural Supabase schema used while the checked-in generated schema is stale.
 *
 * The database boundary is intentionally dynamic until the canonical generated
 * project types are refreshed from Supabase. Application TypeScript remains
 * strict; this avoids treating obsolete table/column definitions as truth.
 */
export type DynamicDatabase = {
  public: {
    Tables: Record<string, DynamicTable>
    Views: Record<string, DynamicTable>
    Functions: Record<
      string,
      {
        Args: any
        Returns: any
      }
    >
    Enums: Record<string, string>
    CompositeTypes: Record<string, unknown>
  }
}
