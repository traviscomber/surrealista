import os
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[v0] ERROR: Missing Supabase credentials")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mapping of Chilean regions by common city/region names
REGION_MAPPING = {
    # Regiones chilenasapproximadas por nombre
    "aysén": "Aysén del General Carlos Ibáñez del Campo",
    "aysen": "Aysén del General Carlos Ibáñez del Campo",
    "temuco": "La Araucanía",
    "araucanía": "La Araucanía",
    "araucania": "La Araucanía",
    "punta arenas": "Magallanes y de la Antártida Chilena",
    "magallanes": "Magallanes y de la Antártida Chilena",
    "santiago": "Metropolitana de Santiago",
    "metropolitana": "Metropolitana de Santiago",
    "valparaíso": "Valparaíso",
    "valparaiso": "Valparaíso",
    "concepción": "Bío Bío",
    "concepcion": "Bío Bío",
    "bio bio": "Bío Bío",
    "biobio": "Bío Bío",
    "la serena": "Coquimbo",
    "coquimbo": "Coquimbo",
    "la calera": "Coquimbo",
    "puerto montt": "Los Lagos",
    "puerto varas": "Los Lagos",
    "lagos": "Los Lagos",
    "pucón": "La Araucanía",
    "pucon": "La Araucanía",
    "villarrica": "La Araucanía",
    "osorno": "Los Lagos",
    "puerto octay": "Los Lagos",
    "los ángeles": "Bío Bío",
    "los angeles": "Bío Bío",
    "ovalle": "Coquimbo",
    "la ligua": "Valparaíso",
    "quillota": "Valparaíso",
    "calama": "Antofagasta",
    "antofagasta": "Antofagasta",
    "iquique": "Tarapacá",
    "tarapaca": "Tarapacá",
    "arica": "Arica y Parinacota",
    "parinacota": "Arica y Parinacota",
    "atacama": "Atacama",
    "copiapó": "Atacama",
    "copiapo": "Atacama",
}

print("[v0] Updating region values in kmz_location_index based on file names and cities...")

# Get all locations to update
response = supabase.table("kmz_location_index").select("id, name, region, city").execute()
locations = response.data

print(f"[v0] Found {len(locations)} locations to potentially update")

updates_needed = 0
for loc in locations:
    old_region = loc.get("region", "")
    name = loc.get("name", "").lower()
    city = loc.get("city", "").lower()
    
    # Search for region in name and city
    new_region = old_region
    
    for key, region in REGION_MAPPING.items():
        if key in name or key in city:
            new_region = region
            break
    
    # Only update if region changed
    if new_region != old_region and new_region != old_region:
        updates_needed += 1
        try:
            supabase.table("kmz_location_index").update({"region": new_region}).eq("id", loc["id"]).execute()
            print(f"[v0] Updated location '{name}' region: '{old_region}' -> '{new_region}'")
        except Exception as e:
            print(f"[v0] Error updating location {loc['id']}: {e}")

print(f"[v0] Region update complete. Updated {updates_needed} locations")
