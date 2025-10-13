"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Create a single supabase client for the entire client-side application
export const supabase = createClientComponentClient<Database>()

// Export a createClient function for components that need a fresh client
export const createClient = () => createClientComponentClient<Database>()

export const createBrowserClient = createClient
