import type React from "react"
import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PasswordGate } from "@/components/auth/password-gate"
import { VisitReminders } from "@/components/visits/visit-reminders"
import { Toaster } from "sonner"
import { SentryInit } from "@/components/sentry-init"

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Sur-Realista Interno",
  description:
    "Centro operativo interno para búsqueda, administración, análisis KMZ y documentación de Sur-Realista.",
  keywords: "sur-realista, interno, operación, administración, kmz, análisis, documentación",
  generator: "v0.dev",
}

const camposNormalizerBootstrap = `
(function () {
  function asCoordinate(value) {
    if (!Array.isArray(value) || value.length < 2) return null;
    var lng = Number(value[0]);
    var lat = Number(value[1]);
    var alt = value.length > 2 ? Number(value[2]) : undefined;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    return Number.isFinite(alt) ? [lng, lat, alt] : [lng, lat];
  }

  function normalizeCoordinates(value) {
    if (!Array.isArray(value)) return [];
    var direct = value.map(asCoordinate).filter(Boolean);
    if (direct.length > 0) return direct;
    if (value.length === 1 && Array.isArray(value[0])) return normalizeCoordinates(value[0]);
    return [];
  }

  function samePoint(a, b) {
    return Boolean(a && b && a[0] === b[0] && a[1] === b[1]);
  }

  function inferType(coordinates, declared) {
    var normalized = declared ? String(declared).toLowerCase() : "";
    if (normalized.indexOf("polygon") >= 0 && coordinates.length >= 4) return "Polygon";
    if (normalized.indexOf("line") >= 0 && coordinates.length >= 2) return "LineString";
    if (normalized.indexOf("point") >= 0 && coordinates.length >= 1) return "Point";
    if (coordinates.length === 1) return "Point";
    if (coordinates.length >= 4 && samePoint(coordinates[0], coordinates[coordinates.length - 1])) return "Polygon";
    return "LineString";
  }

  function boundsFor(coordinates) {
    var lngs = coordinates.map(function (point) { return point[0]; });
    var lats = coordinates.map(function (point) { return point[1]; });
    return {
      north: Math.max.apply(Math, lats),
      south: Math.min.apply(Math, lats),
      east: Math.max.apply(Math, lngs),
      west: Math.min.apply(Math, lngs)
    };
  }

  function centerFor(coordinates) {
    var bounds = boundsFor(coordinates);
    return { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 };
  }

  function mergeBounds(placemarks) {
    return placemarks.reduce(function (result, item) {
      return {
        north: Math.max(result.north, item.bounds.north),
        south: Math.min(result.south, item.bounds.south),
        east: Math.max(result.east, item.bounds.east),
        west: Math.min(result.west, item.bounds.west)
      };
    }, { north: -90, south: 90, east: -180, west: 180 });
  }

  function normalize(record, storedPlacemarks) {
    storedPlacemarks = Array.isArray(storedPlacemarks) ? storedPlacemarks : [];
    var sourceRows = storedPlacemarks.length > 0
      ? storedPlacemarks
      : (Array.isArray(record && record.coordinates) ? record.coordinates : []);
    var seen = new Set();
    var placemarks = [];

    sourceRows.forEach(function (row, index) {
      var stored = storedPlacemarks.length > 0 ? row : null;
      var coordinates = normalizeCoordinates(stored ? stored.coordinates : row);
      if (coordinates.length === 0) return;
      var type = inferType(coordinates, stored && stored.type);
      var key = type + ":" + JSON.stringify(coordinates);
      if (seen.has(key)) return;
      seen.add(key);
      var label = type === "Polygon" ? "Polígono" : type === "LineString" ? "Línea" : "Punto";
      var bounds = boundsFor(coordinates);
      placemarks.push({
        name: stored && stored.name ? String(stored.name).trim() : ((record && record.file_name) || "KMZ") + " · " + label + " " + (index + 1),
        description: (stored && stored.description) || (record && record.description) || "",
        coordinates: coordinates,
        type: type,
        styleUrl: stored && stored.style_url ? stored.style_url : undefined,
        properties: Object.assign({}, (stored && stored.properties) || {}, {
          rol: (record && record.rol_numbers && record.rol_numbers[index]) || ((stored && stored.properties && stored.properties.rol) || ""),
          category: (record && record.category) || ((stored && stored.properties && stored.properties.category) || "general"),
          recoveredFrom: stored ? "kmz_placemarks" : "kmz_collection.coordinates"
        }),
        center: centerFor(coordinates),
        bounds: bounds,
        region: (stored && stored.region) || (record && record.region) || undefined
      });
    });

    return {
      coordinates: placemarks.map(function (item) { return item.coordinates; }),
      placemarks: placemarks,
      bounds: placemarks.length > 0 ? mergeBounds(placemarks) : { north: 0, south: 0, east: 0, west: 0 },
      region: record && record.region ? record.region : undefined,
      counts: {
        total: placemarks.length,
        points: placemarks.filter(function (item) { return item.type === "Point"; }).length,
        lines: placemarks.filter(function (item) { return item.type === "LineString"; }).length,
        polygons: placemarks.filter(function (item) { return item.type === "Polygon"; }).length
      },
      source: storedPlacemarks.length > 0 ? "kmz_placemarks" : "kmz_collection.coordinates",
      validationErrors: placemarks.length > 0 ? [] : ["No existe geometría válida recuperable en la base de datos"],
      hash: "client-runtime"
    };
  }

  window.normalizeKmzRecord = normalize;
  window.__SUR_REALISTA_CAMPOS_NORMALIZER_READY__ = true;
  var normalizeKmzRecord = normalize;
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: camposNormalizerBootstrap }} />
      </head>
      <body className={`${inter.variable} ${lora.variable} font-sans bg-background text-foreground`}>
        <SentryInit />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="sur-realista-theme"
        >
          <PasswordGate>{children}</PasswordGate>
        </ThemeProvider>
        <Toaster />
        <VisitReminders />
      </body>
    </html>
  )
}