type DynamicRow = any

type DynamicRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type DynamicTable = {
  Row: DynamicRow
  Insert: DynamicRow
  Update: DynamicRow
  Relationships: DynamicRelationship[]
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
        Args: Record<string, unknown>
        Returns: unknown
      }
    >
    Enums: Record<string, string>
    CompositeTypes: Record<string, unknown>
  }
}
