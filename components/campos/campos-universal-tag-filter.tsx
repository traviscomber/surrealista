"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Focus } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Field = { id:string; file_name:string; region:string|null; tags:string[]|null }

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

  useEffect(()=>{let cancelled=false;(async()=>{const {data}=await supabase.from("kmz_collection").select("id,file_name,region,tags").eq("is_active",true).limit(5000);if(!cancelled)setFields((data||[]) as Field[])})();return()=>{cancelled=true}},[supabase])

  useEffect(()=>{let frame=0;const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setSidebarRegion(readSidebarRegion()))};sync();const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["data-state","aria-checked","class"]});return()=>{cancelAnimationFrame(frame);observer.disconnect()}},[])

  const kmzId=searchParams.get("kmz")||""
  const focusedField=useMemo(()=>fields.find(field=>`${field.id}`===kmzId)||null,[fields,kmzId])
  const requestedRegion=splitParam(searchParams.get("regions"))[0]||""
  const regionSource=focusedField?.region||sidebarRegion||requestedRegion
  const canonicalRegion=useMemo(()=>{const key=normalizeRegion(regionSource);return fields.find(field=>field.region&&normalizeRegion(field.region)===key)?.region||""},[fields,regionSource])
  const regionalFields=useMemo(()=>canonicalRegion?fields.filter(field=>field.region&&normalizeRegion(field.region)===normalizeRegion(canonicalRegion)):[],[canonicalRegion,fields])

  useEffect(()=>{
    if(!canonicalRegion)return
    const current=splitParam(searchParams.get("regions"))[0]||""
    if(current===canonicalRegion)return
    const params=new URLSearchParams(searchParams.toString())
    params.set("regions",canonicalRegion)
    router.replace(`${pathname}?${params.toString()}`,{scroll:false})
  },[canonicalRegion,pathname,router,searchParams])

  const exitFocus=()=>{const params=new URLSearchParams(searchParams.toString());params.delete("kmz");router.replace(`${pathname}?${params.toString()}`,{scroll:false})}

  if(!focusedField)return null

  return <div ref={rootRef} className="pointer-events-auto absolute left-[372px] right-5 top-[58px] z-[620] hidden lg:block 2xl:left-[392px]">
    <div className="mx-auto max-w-[980px] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur">
      <div className="flex min-h-11 items-center gap-2 px-3 py-2">
        <Focus className="h-3.5 w-3.5 shrink-0 text-slate-500"/>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Foco</span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{focusedField.file_name}</span>
        {canonicalRegion?<Badge className="h-6 rounded-full bg-slate-100 px-2 text-[10px] font-medium text-slate-600">{displayRegion(canonicalRegion)}</Badge>:null}
        <Button type="button" variant="outline" size="sm" onClick={exitFocus} className="h-7 rounded-lg px-2.5 text-[11px]">Volver a {regionalFields.length} KMZ</Button>
      </div>
    </div>
  </div>
}
