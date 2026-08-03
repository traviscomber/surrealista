"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Loader2, MapPin, RotateCcw, Search, X } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Field = { id:string; file_name:string; region:string|null; tags:string[]|null; rol_numbers:string[]|null; owner:string|null }
type TagOption = { label:string; tag:string }
type TagGroup = { label:string; options:TagOption[] }

const TAG_GROUPS: TagGroup[] = [
  { label:"Suelo", options:[
    {label:"Agrícola",tag:"suelo:agricola"},{label:"Forestal",tag:"suelo:forestal"},{label:"Agrícola forestal",tag:"suelo:agricola-forestal"},{label:"Habitacional",tag:"suelo:habitacional"},{label:"Comercial",tag:"suelo:comercial"},{label:"Industrial",tag:"suelo:industrial"},{label:"Hotelero",tag:"suelo:hotelero"},{label:"Sitio eriazo",tag:"suelo:sitio-eriazo"},
  ]},
  { label:"Agua", options:[
    {label:"Colinda río/estero",tag:"agua:colinda-rio-estero"},{label:"Río/estero < 100 m",tag:"agua:rio-estero-menos-100m"},{label:"Río/estero < 500 m",tag:"agua:rio-estero-menos-500m"},{label:"Frente lago/laguna",tag:"agua:frente-lago-laguna"},{label:"Lago/laguna < 500 m",tag:"agua:lago-laguna-menos-500m"},{label:"Frente mar",tag:"agua:frente-mar"},{label:"Costa < 2 km",tag:"agua:costa-menos-2km"},
  ]},
  { label:"Acceso y entorno", options:[
    {label:"Camino < 250 m",tag:"acceso:camino-menos-250m"},{label:"Ruta < 1 km",tag:"acceso:ruta-menos-1km"},{label:"Localidad < 2 km",tag:"cercania:localidad-menos-2km"},{label:"Localidad < 10 km",tag:"cercania:localidad-menos-10km"},{label:"Área protegida < 1 km",tag:"entorno:area-protegida-menos-1km"},
  ]},
  { label:"Geometría", options:[
    {label:"Polígono",tag:"geometria:poligono"},{label:"Múltiple",tag:"geometria:multiple"},{label:"Punto",tag:"geometria:punto"},{label:"Línea",tag:"geometria:linea"},{label:"Solo ubicación",tag:"geometria:solo-ubicacion"},{label:"Listo para mapa",tag:"estado:listo-mapa"},
  ]},
  { label:"Datos y calidad", options:[
    {label:"Con ROL",tag:"datos:con-rol"},{label:"Sin ROL",tag:"datos:sin-rol"},{label:"Posible duplicado",tag:"calidad:duplicado-posible"},{label:"Requiere reparseo",tag:"estado:requiere-reparseo"},{label:"Revisión de traza",tag:"estado:revision-traza"},{label:"Alta complejidad",tag:"calidad:alta-complejidad"},
  ]},
]

const LABEL_BY_TAG = new Map(TAG_GROUPS.flatMap(g=>g.options.map(o=>[o.tag,o.label] as const)))
const cleanRegion = (value:string)=>value.replace(/^Region de /i,"").replace(/^Region del /i,"")

export function CAMPOSRegionalTagFilterV2(){
  const router=useRouter()
  const supabase=useMemo(()=>createBrowserClient(),[])
  const rootRef=useRef<HTMLDivElement>(null)
  const [regions,setRegions]=useState<string[]>([])
  const [selectedRegions,setSelectedRegions]=useState<string[]>([])
  const [selectedTags,setSelectedTags]=useState<string[]>([])
  const [regionalFields,setRegionalFields]=useState<Field[]>([])
  const [loadingRegions,setLoadingRegions]=useState(true)
  const [loadingFields,setLoadingFields]=useState(false)
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState("")

  useEffect(()=>{let cancelled=false;(async()=>{setLoadingRegions(true);const {data}=await supabase.from("kmz_collection").select("region").eq("is_active",true).not("region","is",null).limit(5000);if(cancelled)return;setRegions(Array.from(new Set((data||[]).map((x:any)=>`${x.region||""}`.trim()).filter(Boolean))).sort((a,b)=>cleanRegion(a).localeCompare(cleanRegion(b),"es")));setLoadingRegions(false)})();return()=>{cancelled=true}},[supabase])
  useEffect(()=>{const close=(e:PointerEvent)=>{if(rootRef.current&&!rootRef.current.contains(e.target as Node))setOpen(false)};window.addEventListener("pointerdown",close);return()=>window.removeEventListener("pointerdown",close)},[])
  useEffect(()=>{let cancelled=false;(async()=>{if(!selectedRegions.length){setRegionalFields([]);setLoadingFields(false);return}setLoadingFields(true);const {data,error}=await supabase.from("kmz_collection").select("id,file_name,region,tags,rol_numbers,owner").eq("is_active",true).in("region",selectedRegions).order("file_name",{ascending:true}).limit(5000);if(cancelled)return;setRegionalFields(error?[]:(data||[]) as Field[]);setLoadingFields(false)})();return()=>{cancelled=true}},[selectedRegions,supabase])

  const tagCounts=useMemo(()=>{const counts=new Map<string,number>();for(const field of regionalFields)for(const tag of field.tags||[])counts.set(tag,(counts.get(tag)||0)+1);return counts},[regionalFields])
  const results=useMemo(()=>{const q=query.trim().toLowerCase();return regionalFields.filter(field=>{const tags=new Set(field.tags||[]);if(!selectedTags.every(tag=>tags.has(tag)))return false;if(!q)return true;return `${field.file_name} ${field.region||""} ${field.owner||""} ${(field.rol_numbers||[]).join(" ")}`.toLowerCase().includes(q)})},[query,regionalFields,selectedTags])

  const toggleRegion=(region:string)=>{setSelectedRegions(current=>current.includes(region)?current.filter(x=>x!==region):[...current,region]);setSelectedTags([]);setQuery("")}
  const toggleTag=(tag:string)=>{if(!selectedRegions.length||!(tagCounts.get(tag)||0))return;setSelectedTags(current=>current.includes(tag)?current.filter(x=>x!==tag):[...current,tag])}
  const clear=()=>{setSelectedRegions([]);setSelectedTags([]);setRegionalFields([]);setQuery("")}

  return <div ref={rootRef} className="pointer-events-auto absolute left-[372px] right-5 top-[58px] z-[620] hidden lg:block 2xl:left-[392px]">
    <div className="mx-auto max-w-[1180px] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur">
      <div className="flex min-h-11 items-center gap-2 px-2.5 py-2">
        <Button type="button" variant="ghost" size="sm" onClick={()=>setOpen(v=>!v)} className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"><MapPin className="h-3.5 w-3.5"/>Región{selectedRegions.length>0&&<Badge className="h-5 min-w-5 rounded-full bg-slate-900 px-1.5 text-[10px] text-white">{selectedRegions.length}</Badge>}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open?"rotate-180":""}`}/></Button>
        <div className="h-5 w-px bg-slate-200"/>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">{!selectedRegions.length?<span className="truncate px-1 text-xs font-medium text-slate-600">Selecciona una región para habilitar los tags comunes</span>:<>{selectedRegions.slice(0,2).map(region=><button key={region} type="button" onClick={()=>toggleRegion(region)} className="flex h-7 max-w-[190px] items-center gap-1 rounded-full bg-slate-900 px-2.5 text-[11px] font-semibold text-white"><span className="truncate">{cleanRegion(region)}</span><X className="h-3 w-3 shrink-0"/></button>)}{selectedRegions.length>2&&<span className="text-[11px] font-semibold text-slate-500">+{selectedRegions.length-2}</span>}{selectedTags.slice(0,3).map(tag=><button key={tag} type="button" onClick={()=>toggleTag(tag)} className="flex h-7 max-w-[170px] items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"><span className="truncate">{LABEL_BY_TAG.get(tag)||tag}</span><X className="h-3 w-3 shrink-0"/></button>)}{selectedTags.length>3&&<span className="text-[11px] text-slate-500">+{selectedTags.length-3}</span>}</>}</div>
        {loadingFields?<Loader2 className="h-4 w-4 animate-spin text-slate-400"/>:selectedRegions.length>0?<button type="button" onClick={()=>setOpen(true)} className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">{results.length} campos</button>:null}
        {(selectedRegions.length>0||selectedTags.length>0)&&<Button type="button" variant="ghost" size="icon" onClick={clear} className="h-8 w-8 shrink-0 rounded-lg" title="Limpiar filtros"><RotateCcw className="h-3.5 w-3.5"/></Button>}
      </div>
      {open&&<div className="grid max-h-[560px] grid-cols-[250px_minmax(0,1fr)_360px] overflow-hidden border-t border-slate-200">
        <section className="overflow-y-auto border-r border-slate-200 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">1. Región</p>{loadingRegions&&<Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400"/>}</div><div className="space-y-1">{regions.map(region=>{const active=selectedRegions.includes(region);return <button key={region} type="button" onClick={()=>toggleRegion(region)} className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] ${active?"bg-slate-900 font-semibold text-white":"text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><span className="truncate">{cleanRegion(region)}</span>{active&&<Check className="h-3 w-3"/>}</button>})}</div></section>
        <section className={`overflow-y-auto p-3 ${!selectedRegions.length?"pointer-events-none opacity-40":""}`}><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">2. Tags dentro de la región</p><span className="text-[10px] text-slate-400">Todos deben coincidir</span></div><div className="grid grid-cols-5 gap-3">{TAG_GROUPS.map(group=><div key={group.label} className="min-w-0"><p className="mb-2 text-[10px] font-semibold text-slate-500">{group.label}</p><div className="space-y-1">{group.options.map(option=>{const active=selectedTags.includes(option.tag),count=tagCounts.get(option.tag)||0,disabled=count===0;return <button key={option.tag} type="button" disabled={disabled} onClick={()=>toggleTag(option.tag)} className={`flex w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-left text-[11px] ${active?"bg-slate-900 font-semibold text-white":disabled?"cursor-not-allowed text-slate-300":"text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><span className="truncate">{option.label}</span><span className={`shrink-0 text-[9px] ${active?"text-white/70":"text-slate-400"}`}>{count}</span></button>})}</div></div>)}</div></section>
        <section className="flex min-h-0 flex-col border-l border-slate-200 bg-slate-50/80"><div className="border-b border-slate-200 p-2.5"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar campo, propietario o ROL" className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs outline-none focus:border-slate-400"/></div></div><div className="min-h-0 flex-1 overflow-y-auto p-2">{!selectedRegions.length?<p className="px-2 py-8 text-center text-xs text-slate-500">Primero selecciona una región.</p>:loadingFields?<div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Cargando campos de la región</div>:results.length===0?<p className="px-2 py-8 text-center text-xs text-slate-500">No hay campos con esta combinación.</p>:results.map(field=><button key={field.id} type="button" onClick={()=>{setOpen(false);router.push(`/campos?kmz=${encodeURIComponent(field.id)}`)}} className="mb-1 w-full rounded-lg border border-transparent bg-white px-2.5 py-2 text-left hover:border-slate-200 hover:bg-slate-50"><p className="truncate text-xs font-semibold text-slate-800">{field.file_name}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{cleanRegion(field.region||"Sin región")}{field.rol_numbers?.length?` · ROL ${field.rol_numbers[0]}`:""}</p></button>)}</div></section>
      </div>}
    </div>
  </div>
}
