import "@/lib/chile-geographic-data"

declare module "@/lib/chile-geographic-data" {
  interface RegionData {
    /** Legacy whitepaper alias. Canonical field is `provinces`. */
    provincias?: ProvinceData[]
  }

  interface ComunaData {
    /** Legacy whitepaper alias. Canonical field is `capitalCoords`. */
    coords?: { lat: number; lng: number }
  }
}

export {}
