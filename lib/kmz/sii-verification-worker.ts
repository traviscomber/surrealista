import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { SiiMapasPublicProvider } from '@/lib/sii/sii-mapas-public-client'
import { parseRolParts } from '@/lib/sii/types'

type Bounds = { north?: number; south?: number; east?: number; west?: number }
type Point = { lat: number; lng: number; label: string; source: 'coordinates' | 'bounds' }
type PendingRow = {
  id: string
  file_name: string
  region: string | null
  bounds: Bounds | null
  coordinates: unknown
  description: string | null
  rol_numbers: string[] | null
  metadata: Record<string, any> | null
}
type VerificationStatus = 'verified' | 'mismatch' | 'no_record' | 'error' | 'missing_sii_code'
type Attempt = { label: string; source: Point['source']; lat: number; lng: number; span: number; found: boolean; returnedCommune?: string; error?: string }

export type SiiVerificationResult = {
  attempted: number; verified: number; mismatched: number; noRecord: number; errored: number; skipped: number
  rows: Array<{ id: string; fileName: string; status: VerificationStatus; commune?: string; siiCode?: string; attempts?: number; returnedCommune?: string; error?: string }>
}

function normalize(value: string | null | undefined) {
  const normalized = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  return normalized === 'coihaique' ? 'coyhaique' : normalized
}
function inferredSiiCode(commune: string, explicitCode: unknown) {
  const explicit = String(explicitCode || '').trim()
  if (explicit) return explicit
  return normalize(commune) === 'coyhaique' ? '11401' : ''
}
function boundsNumbers(bounds: Bounds | null) {
  const north=Number(bounds?.north),south=Number(bounds?.south),east=Number(bounds?.east),west=Number(bounds?.west)
  return [north,south,east,west].every(Number.isFinite) ? { north,south,east,west } : null
}
function pushCoordinates(value: unknown, bucket: Point[]) {
  if (!value) return
  if (Array.isArray(value)) {
    if (value.length >= 2 && value.length <= 3 && value.every((v) => Number.isFinite(Number(v)))) {
      const a=Number(value[0]),b=Number(value[1]); const lat=Math.abs(a)<=90?a:b; const lng=Math.abs(a)<=90?b:a
      if (Math.abs(lat)<=90 && Math.abs(lng)<=180) bucket.push({lat,lng,label:`coordinate-${bucket.length+1}`,source:'coordinates'})
      return
    }
    for (const nested of value) pushCoordinates(nested,bucket)
    return
  }
  if (typeof value === 'object') {
    const obj=value as Record<string,unknown>
    const lat=Number(obj.latitude ?? obj.lat)
    const lng=Number(obj.longitude ?? obj.lng ?? obj.lon)
    if (Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180) {
      bucket.push({lat,lng,label:`coordinate-${bucket.length+1}`,source:'coordinates'})
    }
    for (const [key,nested] of Object.entries(obj)) {
      if (['latitude','lat','longitude','lng','lon'].includes(key)) continue
      pushCoordinates(nested,bucket)
    }
  }
}
function dedupe(points: Point[]) {
  const seen=new Set<string>(); return points.filter((p)=>{const k=`${p.lat.toFixed(7)},${p.lng.toFixed(7)}`; if(seen.has(k)) return false; seen.add(k); return true})
}
function getSamplePoints(bounds: Bounds | null, coordinates: unknown, fallbackCenter: { lat?: unknown; lng?: unknown }) {
  const coordinatePoints: Point[]=[]; pushCoordinates(coordinates,coordinatePoints)
  const coord=dedupe(coordinatePoints); const sampled: Point[]=[]
  if (coord.length) { const limit=Math.min(6,coord.length); const step=coord.length===1?0:(coord.length-1)/(limit-1); for(let i=0;i<limit;i++) sampled.push(coord[Math.round(i*step)]) }
  const parsed=boundsNumbers(bounds)
  if (parsed) { const {north,south,east,west}=parsed,lat=north-south,lng=east-west; sampled.push(
    {lat:south+lat*.5,lng:west+lng*.5,label:'center',source:'bounds'},
    {lat:south+lat*.75,lng:west+lng*.25,label:'north-west',source:'bounds'},
    {lat:south+lat*.25,lng:west+lng*.75,label:'south-east',source:'bounds'})
  } else if (!sampled.length) {
    const lat=Number(fallbackCenter.lat),lng=Number(fallbackCenter.lng); if(Number.isFinite(lat)&&Number.isFinite(lng)) sampled.push({lat,lng,label:'center',source:'bounds'})
  }
  return dedupe(sampled).slice(0,9)
}
function getSpanSequence(bounds: Bounds | null) {
  const parsed=boundsNumbers(bounds); if(!parsed) return [0.02,0.04,0.08]
  const natural=Math.max(Math.abs(parsed.north-parsed.south),Math.abs(parsed.east-parsed.west)); const base=Math.min(Math.max(natural*1.5,0.02),0.12)
  return Array.from(new Set([base,Math.min(base*2,0.12),Math.min(base*4,0.12)].map((v)=>Number(v.toFixed(4)))))
}
function expandRole(role: string, siiCode: string) {
  const parsed=parseRolParts(role); if(!parsed) return null
  if(parsed.comuna) return parsed
  return parseRolParts(`${siiCode}-${parsed.manzana}-${parsed.predio}`)
}

export async function verifyPendingSiiTerritorialResolutions(options:{limit?:number;persist?:boolean}={}):Promise<SiiVerificationResult>{
  const limit=Math.min(Math.max(options.limit||3,1),6),persist=options.persist!==false,supabase=getAdminClient(),provider=new SiiMapasPublicProvider()
  const result:SiiVerificationResult={attempted:0,verified:0,mismatched:0,noRecord:0,errored:0,skipped:0,rows:[]}
  const {data,error}=await supabase.rpc('get_kmz_pending_sii_verification',{p_limit:limit}); if(error) throw error
  for(const row of (data||[]) as PendingRow[]){
    const territorial=row.metadata?.territorial_resolution||{},commune=String(territorial.commune||'').trim(),siiCode=inferredSiiCode(commune,territorial.siiVerification?.siiCode)
    const points=getSamplePoints(row.bounds,row.coordinates,territorial.center||{}),spans=getSpanSequence(row.bounds)
    if(!commune||!siiCode||!points.length){result.skipped++;result.rows.push({id:row.id,fileName:row.file_name,status:'missing_sii_code',commune,siiCode});continue}
    result.attempted++
    const attempts:Attempt[]=[]; const roleAttempts:Array<{role:string;found:boolean}> = []; let record:any=null,matchedPoint:Point|null=null,resolutionMethod='point',hadProviderError=false,lastError=''
    for(const role of row.rol_numbers||[]){
      const parsed=expandRole(role,siiCode); if(!parsed?.comuna||!parsed.manzana||!parsed.predio) continue
      try{const candidate=await provider.getByRol(parsed);roleAttempts.push({role,found:Boolean(candidate)});if(candidate){record=candidate;resolutionMethod='text';break}}catch(error){hadProviderError=true;lastError=(error as Error).message}
    }
    if(!record){
      for(const point of points){for(const span of spans){try{const candidate=await provider.getByPoint({comuna:siiCode,lat:point.lat,lng:point.lng,span});attempts.push({...point,span,found:Boolean(candidate),returnedCommune:candidate?.comuna||undefined});if(candidate){record=candidate;matchedPoint=point;break}}catch(error){hadProviderError=true;lastError=(error as Error).message;attempts.push({...point,span,found:false,error:lastError.slice(0,500)})}}if(record)break}
    }
    const checkedAt=new Date().toISOString(),verified=Boolean(record&&normalize(record.comuna)===normalize(commune)),status:VerificationStatus=verified?'verified':record?'mismatch':hadProviderError?'error':'no_record'
    if(persist){
      const verification:Record<string,any>={status,verified,siiCode,checked_at:checkedAt,attempts,roleAttempts,sampling:{points:points.length,spans},resolutionMethod}; if(record)verification.record=record;if(status==='error')verification.error=lastError.slice(0,1000)
      const metadata:Record<string,any>={...(row.metadata||{}),territorial_resolution:{...territorial,siiVerification:verification}}
      if(verified&&record) metadata.sii_point_resolution={center:matchedPoint||territorial.center,comuna:siiCode,record,source:'SII Mapas getFeatureInfo',attempts,textAttempts:roleAttempts,sampling:verification.sampling,resolved_at:checkedAt,resolutionMethod:resolutionMethod==='text'?'text':'deferred-dpa-verification'}
      const {error:updateError}=await supabase.from('kmz_collection').update({metadata,rol_numbers:Array.from(new Set([...(row.rol_numbers||[]),record?.rol].filter(Boolean)))}).eq('id',row.id); if(updateError) throw updateError
    }
    if(status==='verified')result.verified++;else if(status==='mismatch')result.mismatched++;else if(status==='no_record')result.noRecord++;else result.errored++
    result.rows.push({id:row.id,fileName:row.file_name,status,commune,siiCode,attempts:attempts.length,returnedCommune:record?.comuna||undefined,error:status==='error'?lastError:undefined})
  }
  return result
}
