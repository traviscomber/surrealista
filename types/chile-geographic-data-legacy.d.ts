import "@/lib/chile-geographic-data"

declare module "@/lib/chile-geographic-data" {
  interface RegionData {
    /** Legacy whitepaper alias. Canonical field is `provinces`. */
    provincias?: ProvinceData[]
  }
}

export {}
