import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

const ACCESS_COOKIE = 'sur_realista_access'
const MIN_COMPARABLES = 3
const MAX_AREA_SQM = 1_000_000_000

interface MarketSnapshot {
  sample_count: number
  median_price_m2_clp: number