import { createClient } from "@supabase/supabase-js"

type CandidateLike = {
  id?: string | null
  lat?: number | null
  lng?: number | null
  geocode_precision?: string | null
  commune?: string | null
  region?: string | null
  prospecting_fit_score?: number | null
}

type KmzIndexRow = {
  id: string
  name: string | null
  latitude: number | null
  longitude: number | null
  region: string | null
  city: string | null
  address: string | null
  kmz_id: string | null
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function normalize(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-CL")
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function hasReliablePoint(candidate: CandidateLike) {
  return Number.isFinite(Number(candidate.lat)) && Number.isFinite(Number(candidate.lng)) && candidate.geocode_precision !== "territorial"
}

function ownerEvidence(row: any) {
  const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {}
  const confirmed = String(metadata.confirmed_owner || "").trim()
  const direct = String(row?.owner || "").trim()
  const publicCandidate = metadata.public_owner_candidate && typeof metadata.public_owner_candidate === "object"
    ? metadata.public_owner_candidate
    : null
  const publicName = String(publicCandidate?.name || "").trim()
  const publicConfidence = Number(publicCandidate?.confidence || metadata.owner_confidence || 0)

  if (confirmed) return { name: confirmed, confidence: 1, basis: "confirmed_owner" }
  if (direct) return { name: direct, confidence: 0.9, basis: "kmz_owner" }
  if (publicName && publicConfidence >= 0.75) return { name: publicName, confidence: publicConfidence, basis: "public_evidence" }
  return null
}

export async function linkCandidatesToKmz(candidates: CandidateLike[], maxCandidates = 20) {
  const supabase = db()
  if (!supabase) {
    return {
      links: [],
      summary: { candidate_count: candidates.length, reliable_point_count: 0, spatial_link_count: 0, owner_evidence_count: 0, contactable_count: 0 },
      methodology: "unavailable",
    }
  }

  const scopedCandidates = candidates
    .filter((candidate) => candidate?.id)
    .sort((a, b) => Number(b.prospecting_fit_score || 0) - Number(a.prospecting_fit_score || 0))
    .slice(0, Math.max(1, Math.min(maxCandidates, 30)))

  const reliableCandidates = scopedCandidates.filter(hasReliablePoint)
  const communes = Array.from(new Set(reliableCandidates.map((candidate) => normalize(candidate.commune)).filter(Boolean)))

  const indexRows: KmzIndexRow[] = []
  for (const commune of communes.slice(0, 8)) {
    const { data } = await supabase
      .from("kmz_search_index")
      .select("id,name,latitude,longitude,region,city,address,kmz_id")
      .ilike("city", `%${commune.replace(/[%_,()]/g, " ")}%`)
      .limit(300)
    indexRows.push(...((data ?? []) as KmzIndexRow[]))
  }

  const uniqueIndexRows = Array.from(new Map(indexRows.map((row) => [row.id, row])).values())
  const candidateLinks = reliableCandidates.flatMap((candidate) => {
    const lat = Number(candidate.lat)
    const lng = Number(candidate.lng)
    const commune = normalize(candidate.commune)

    return uniqueIndexRows
      .filter((row) => !commune || normalize(row.city).includes(commune) || commune.includes(normalize(row.city)))
      .map((row) => {
        const rowLat = Number(row.latitude)
        const rowLng = Number(row.longitude)
        if (!Number.isFinite(rowLat) || !Number.isFinite(rowLng)) return null
        const distanceKm = haversineKm(lat, lng, rowLat, rowLng)
        if (distanceKm > 3) return null
        return {
          candidate_id: String(candidate.id),
          kmz_index_id: row.id,
          kmz_id: row.kmz_id,
          kmz_name: row.name,
          kmz_address: row.address,
          distance_km: Number(distanceKm.toFixed(2)),
          spatial_confidence: distanceKm <= 0.5 ? "high" : distanceKm <= 1 ? "medium" : "nearby",
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distance_km - b.distance_km)
      .slice(0, 3)
  }) as Array<{
    candidate_id: string
    kmz_index_id: string
    kmz_id: string | null
    kmz_name: string | null
    kmz_address: string | null
    distance_km: number
    spatial_confidence: "high" | "medium" | "nearby"
  }>

  const kmzIds = Array.from(new Set(candidateLinks.map((link) => link.kmz_id).filter(Boolean))) as string[]
  const kmzMeta = kmzIds.length
    ? await supabase
        .from("kmz_collection")
        .select("id,file_name,owner,pic,pic_phone,pic_email,rol_numbers,metadata,is_active")
        .in("id", kmzIds)
        .eq("is_active", true)
    : { data: [], error: null }

  const metaById = new Map((kmzMeta.data ?? []).map((row: any) => [String(row.id), row]))
  const links = candidateLinks.map((link) => {
    const row = link.kmz_id ? metaById.get(String(link.kmz_id)) : null
    const owner = ownerEvidence(row)
    const contactable = Boolean(row?.pic_phone || row?.pic_email)
    return {
      ...link,
      rol_numbers: row?.rol_numbers ?? [],
      owner,
      pic: row?.pic || null,
      pic_phone: row?.pic_phone || null,
      pic_email: row?.pic_email || null,
      contactable,
      identity_status: "spatial_candidate",
    }
  })

  const linkedCandidateIds = new Set(links.map((link) => link.candidate_id))
  const ownerCandidateIds = new Set(links.filter((link) => link.owner).map((link) => link.candidate_id))
  const contactableCandidateIds = new Set(links.filter((link) => link.contactable).map((link) => link.candidate_id))

  return {
    links,
    summary: {
      candidate_count: scopedCandidates.length,
      reliable_point_count: reliableCandidates.length,
      spatial_link_count: linkedCandidateIds.size,
      owner_evidence_count: ownerCandidateIds.size,
      contactable_count: contactableCandidateIds.size,
    },
    methodology: "candidate-point-to-kmz-index-within-3km",
    note: "El vínculo es espacial y candidato-a-candidato. No se considera identidad catastral exacta hasta contar con ROL coincidente o intersección de polígonos.",
  }
}
