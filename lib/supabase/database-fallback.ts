type DynamicRow = Record<string, any>

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
 * This keeps query results array/object-shaped for strict TypeScript contextual
 * typing without pretending that obsolete column definitions are authoritative.
 * Replace this with freshly generated project types once the canonical schema
 * file is regenerated from Supabase.
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
