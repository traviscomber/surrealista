"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronDown, Filter, Loader2, RotateCcw, X } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Field = { id:string; file_name:string; region:string|null; tags:string[]|null }
type TagOption = { label:string; tag:string }
type TagGroup = { label:string; options:TagOption[] }

const TAG_GROUPS:TagGroup[] = [
  {label:"Suelo",options:[
    {label:"Agrícola",tag:"suelo:agricola"},{label:"Forestal",tag:"suelo:forestal"},{label:"Agrícola forestal",tag:"suelo:agricola-forestal"},{label:"Habitacional",tag:"suelo:habitacional"},{label:"Comercial",tag:"suelo:comercial"},{label:"Industrial",tag:"suelo:industrial"},{label:"Hotelero",tag:"suelo:hotelero"},{label:"Sitio eriazo",tag:"suelo:sitio-eriazo"},
  ]},
  {label:"Agua",options:[
    {label:"Colinda río/estero",tag:"agua:colinda-rio-estero"},{label:"Río/estero < 100 m",tag:"agua:rio-estero-menos-100m"},{label:"Río/estero < 500 m",tag:"agua:rio-estero-menos-500m"},{label:"Frente lago/laguna",tag:"agua:frente-lago-laguna"},{label:"Lago/laguna < 500 m",tag:"agua:lago-laguna-menos-500m"},{label:"Frente mar",tag:"agua:frente-mar"},{label:"Costa < 2 km",tag:"agua:costa-menos-2km"},
  ]},
  {label:"Acceso y entorno",options:[
    {label:"Camino < 250 m",tag:"acceso:camino-menos-250m"},{label:"Ruta < 1 km",tag:"acceso:ruta-menos-1km"},{label:"Localidad < 2 km",tag:"cercania:localidad-menos-2km"},{label:"Localidad < 10 km",tag:"cercania:localidad-menos-10km"},{label:"Área protegida < 1 km",tag:"entorno:area-protegida-menos-1km"},
  ]},
  {label:"Geometría",options:[
    {label:"Polígono",tag:"geometria:poligono"},{label:"Múltiple",tag:"geometria:multiple"},{label:"Punto",tag:"geometria:punto"},{label:"Línea",tag:"geometria:linea"},{label:"Solo ubicación",tag:"geometria:solo-ubicacion"},{label:"Listo para mapa",tag:"estado:listo-mapa"},
  ]},
  {label:"Datos y calidad",options:[
    {label:"Con ROL",tag:"datos:con-rol"},{label:"Sin ROL",tag:"datos:sin-rol"},{label:"Posible duplicado",tag:"calidad:duplicado-posible"},{label:"Requiere reparseo",tag:"estado:requiere-reparseo"},{label:"Revisión de traza",tag:"estado:revision-traza"},{label:"Alta complejidad",tag:"calidad:alta-complejidad"},
  ]},
]

const LABEL_BY_TAG = new Map(TAG_GROUPS.flatMap(group=>group.options.map(option=>[option.tag,option.label] as const)))
const VALID_TAGS = new Set(TAG_GROUPS.flatMap(group=>group.options.map(option=>option.tag)))
const splitParam=(value:string|null)=>value?.split("|").map(v=>v.trim()).filter(Boolean)||[]
const clean=(value:string)=>value.replace(/\s+/g," ").trim()
const normalizeRegion=(value:string)=>clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/^region\s+(de|del)\s+/,"")
const displayRegion=(value:string)=>value.replace(/^Regi[oó]n de /i,"").replace(/^Regi[oó]n del /i,"")

function readSidebarRegion(){
  const control=document.querySelector<HTMLElement>('.campos-desktop-shell [role="checkbox"][data-state="checked"], .campos-desktop-shell button[role="checkbox"][aria-checked="true"]')
  if(!control)return ""
  const row=control.closest("div.flex.items-center")||control.parentElement
  const button=row?.querySelector<HTMLElement>('button[class*="justify-start"]')
  return clean(button?.querySelector("span.flex-1")?.textContent||button?.textContent||"").replace(/\d+\s*%$/g,"").replace(/\d+$/g,"").trim()
}

export function CAMPOSUniversalTagFilter(){
  const router=useRouter()
  const pathname=usePathname()
  const searchParams=useSearchParams()
  const supabase=useMemo(()=>createBrowserClient(),[])
  const rootRef=useRef<HTMLDivElement>(null)
  const [fields,setFields]=useState<Field[]>([])
  const [sidebarRegion,setSidebarRegion]=useState("")
  const [open,setOpen]=useState(false)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{let cancelled=false;(async()=>{const {data}=await supabase.from("kmz_collection").select("id,file_name,region,tags").eq("is_active",true).limit(5000);if(!cancelled){setFields((data||[]) as Field[]);setLoading(false)}})();return()=>{cancelled=true}},[supabase])

  useEffect(()=>{let frame=0;const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setSidebarRegion(readSidebarRegion()))};sync();const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["data-state","aria-checked","class"]});return()=>{cancelAnimationFrame(frame);observer.disconnect()}},[])

  useEffect(()=>{const close=(event:PointerEvent)=>{if(rootRef.current&&!rootRef.current.contains(event.target as Node))setOpen(false)};window.addEventListener("pointerdown",close);return()=>window.removeEventListener("pointerdown",close)},[])

  const kmzRegion=useMemo(()=>{const id=searchParams.get("kmz");return id?fields.find(field=>`${field.id}`===id)?.region||"":""},[fields,searchParams])
  const requestedRegion=splitParam(searchParams.get("regions"))[0]||""
  const regionSource=kmzRegion||sidebarRegion||requestedRegion
  const canonicalRegion=useMemo(()=>{
    const key=normalizeRegion(regionSource)
    return fields.find(field=>field.region&&normalizeRegion(field.region)===key)?.region||""
  },[fields,regionSource])
  const selectedTags=splitParam(searchParams.get("tags")).filter(tag=>VALID_TAGS.has(tag))

  useEffect(()=>{
    if(!canonicalRegion)return
    const current=splitParam(searchParams.get("regions"))[0]||""
    if(current===canonicalRegion)return
    const sameContext=normalizeRegion(current)===normalizeRegion(canonicalRegion)
    const params=new URLSearchParams(searchParams.toString())
    params.set("regions",canonicalRegion)
    if(!sameContext)params.delete("tags")
    router.replace(`${pathname}?${params.toString()}`,{scroll:false})
  },[canonicalRegion,pathname,router,searchParams])

  const regionalFields=useMemo(()=>canonicalRegion?fields.filter(field=>field.region&&normalizeRegion(field.region)===normalizeRegion(canonicalRegion)):[],[canonicalRegion,fields])
  const tagCounts=useMemo(()=>{const counts=new Map<string,number>();regionalFields.forEach(field=>(field.tags||[]).forEach(tag=>counts.set(tag,(counts.get(tag)||0)+1)));return counts},[regionalFields])
  const visibleCount=useMemo(()=>regionalFields.filter(field=>{const tags=new Set(field.tags||[]);return selectedTags.every(tag=>tags.has(tag))}).length,[regionalFields,selectedTags])

  const toggleTag=(tag:string)=>{
    if(!canonicalRegion||!(tagCounts.get(tag)||0))return
    const next=selectedTags.includes(tag)?selectedTags.filter(value=>value!==tag):[...selectedTags,tag]
    const params=new URLSearchParams(searchParams.toString())
    params.set("regions",canonicalRegion)
    if(next.length)params.set("tags",next.join("|"));else params.delete("tags")
    router.replace(`${pathname}?${params.toString()}`,{scroll:false})
  }

  const clearTags=()=>{const params=new URLSearchParams(searchParams.toString());params.delete("tags");params.delete("q");router.replace(`${pathname}?${params.toString()}`,{scroll:false})}

  return <div ref={rootRef} className="pointer-events-auto absolute left-[372px] right-5 top-[58px] z-[620] hidden lg:block 2xl:left-[392px]">
    <div className="mx-auto max-w-[980px] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur">
      <div className="flex min-h-11 items-center gap-2 px-2.5 py-2">
        <Button type="button" variant="ghost" size="sm" onClick={()=>setOpen(value=>!value)} disabled={!canonicalRegion} className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Filter className="h-3.5 w-3.5"/>Tags<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open?"rotate-180":""}`}/></Button>
        <div className="h-5 w-px bg-slate-200"/>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {!canonicalRegion?<span className="truncate px-1 text-xs font-medium text-slate-600">Selecciona una región en el panel izquierdo</span>:<><Badge className="h-7 max-w-[220px] rounded-full bg-slate-900 px-2.5 text-[11px] font-semibold text-white"><span className="truncate">{displayRegion(canonicalRegion)}</span></Badge>{selectedTags.slice(0,4).map(tag=><button key={tag} type="button" onClick={()=>toggleTag(tag)} className="flex h-7 max-w-[170px] items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"><span className="truncate">{LABEL_BY_TAG.get(tag)||tag}</span><X className="h-3 w-3 shrink-0"/></button>)}{selectedTags.length>4&&<span className="text-[11px] text-slate-500">+{selectedTags.length-4}</span>}</>}
        </div>
        {loading?<Loader2 className="h-4 w-4 animate-spin text-slate-400"/>:canonicalRegion?<button type="button" onClick={()=>setOpen(true)} className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">{visibleCount} / {regionalFields.length} KMZ</button>:null}
        {selectedTags.length>0&&<Button type="button" variant="ghost" size="icon" onClick={clearTags} className="h-8 w-8 shrink-0 rounded-lg" title="Mostrar todos"><RotateCcw className="h-3.5 w-3.5"/></Button>}
      </div>
      {open&&canonicalRegion&&<div className="border-t border-slate-200 p-3">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Filtrar KMZ y capas visibles</p><p className="mt-1 text-xs text-slate-600">Región cargada: {displayRegion(canonicalRegion)}. Todos los tags seleccionados deben coincidir.</p></div><span className="text-xs font-semibold text-slate-700">{visibleCount} resultados</span></div>
        <div className="grid grid-cols-5 gap-3">{TAG_GROUPS.map(group=><section key={group.label} className="min-w-0"><p className="mb-2 text-[10px] font-semibold text-slate-500">{group.label}</p><div className="space-y-1">{group.options.map(option=>{const count=tagCounts.get(option.tag)||0,active=selectedTags.includes(option.tag),disabled=count===0;return <button key={option.tag} type="button" disabled={disabled} onClick={()=>toggleTag(option.tag)} className={`flex w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-left text-[11px] ${active?"bg-slate-900 font-semibold text-white":disabled?"cursor-not-allowed text-slate-300":"text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><span className="truncate">{option.label}</span><span className={`shrink-0 text-[9px] ${active?"text-white/70":"text-slate-400"}`}>{count}</span>{active&&<Check className="h-3 w-3 shrink-0"/>}</button>})}</div></section>)}</div>
      </div>}
    </div>
  </div>
}
