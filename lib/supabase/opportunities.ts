import { createClient } from '@supabase/supabase-js'
import { Opportunity, OpportunityNote, OpportunityImage, OpportunityFilters, SavedOpportunity, PaginatedResponse } from '@/lib/types/opportunities'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

const PAGE_SIZE = 20

export async function getOpportunities(
  filters?: OpportunityFilters,
  page: number = 1,
  pageSize: number = PAGE_SIZE
): Promise<PaginatedResponse<Opportunity>> {
  try {
    let query = supabase.from('opportunities').select('*', { count: 'exact' })

    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }
      if (filters.stage?.length) {
        query = query.in('stage', filters.stage)
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority)
      }
      if (filters.property_type?.length) {
        query = query.in('property_details->>property_type', filters.property_type)
      }
      if (filters.price_min !== undefined) {
        query = query.gte('financial->>asking_price', filters.price_min)
      }
      if (filters.price_max !== undefined) {
        query = query.lte('financial->>asking_price', filters.price_max)
      }
      if (filters.location) {
        query = query.or(
          `location->>city.ilike.%${filters.location}%,location->>address.ilike.%${filters.location}%`
        )
      }
      if (filters.tags?.length) {
        query = query.contains('tags', filters.tags)
      }
    }

    const from = (page - 1) * pageSize
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  } catch (error) {
    console.error('[v0] Error fetching opportunities:', error)
    return { data: [], count: 0, page, pageSize, totalPages: 0 }
  }
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error fetching opportunity:', error)
    return null
  }
}

export async function createOpportunity(opportunity: Partial<Opportunity>, userId: string): Promise<Opportunity | null> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        ...opportunity,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error creating opportunity:', error)
    return null
  }
}

export async function updateOpportunity(id: string, updates: Partial<Opportunity>, userId: string): Promise<Opportunity | null> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error updating opportunity:', error)
    return null
  }
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('opportunities').delete().eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[v0] Error deleting opportunity:', error)
    return false
  }
}

export async function getOpportunityNotes(opportunityId: string): Promise<OpportunityNote[]> {
  try {
    const { data, error } = await supabase
      .from('opportunity_notes')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching notes:', error)
    return []
  }
}

export async function addOpportunityNote(
  opportunityId: string,
  content: string,
  noteType: string,
  userId: string
): Promise<OpportunityNote | null> {
  try {
    const { data, error } = await supabase
      .from('opportunity_notes')
      .insert({
        opportunity_id: opportunityId,
        content,
        note_type: noteType,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error adding note:', error)
    return null
  }
}

export async function getOpportunityImages(opportunityId: string): Promise<OpportunityImage[]> {
  try {
    const { data, error } = await supabase
      .from('opportunity_images')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching images:', error)
    return []
  }
}

export async function saveOpportunity(opportunityId: string, userId: string, listName: string = 'Saved'): Promise<SavedOpportunity | null> {
  try {
    const { data, error } = await supabase
      .from('saved_opportunities')
      .insert({
        opportunity_id: opportunityId,
        user_id: userId,
        list_name: listName,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error saving opportunity:', error)
    return null
  }
}

export async function getSavedOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('saved_opportunities')
      .select('opportunities(*)')
      .eq('user_id', userId)

    if (error) throw error
    return data?.map((item: any) => item.opportunities).filter(Boolean) || []
  } catch (error) {
    console.error('[v0] Error fetching saved opportunities:', error)
    return []
  }
}
