import os
import json
from supabase import create_client

# Initialize Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[v0] ERROR: Missing Supabase credentials")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("[v0] Starting to populate kmz_location_index from kmz_collection metadata...")

# Get all KMZ collection records
response = supabase.table("kmz_collection").select("*").execute()
kmz_files = response.data

print(f"[v0] Found {len(kmz_files)} KMZ files in collection")

total_locations_created = 0
locations_batch = []

for kmz in kmz_files:
    kmz_id = kmz.get("id")
    file_name = kmz.get("file_name", "Unknown")
    region = kmz.get("region", "Unknown Region")
    
    # Create a central point location for each KMZ using the bounds if available
    bounds = kmz.get("bounds")
    
    if bounds and isinstance(bounds, dict):
        try:
            # Calculate center point from bounds
            min_lat = bounds.get("minLat", -90)
            max_lat = bounds.get("maxLat", 90)
            min_lon = bounds.get("minLon", -180)
            max_lon = bounds.get("maxLon", 180)
            
            center_lat = (min_lat + max_lat) / 2
            center_lon = (min_lon + max_lon) / 2
            
            location = {
                "kmz_id": kmz_id,
                "name": file_name,
                "latitude": center_lat,
                "longitude": center_lon,
                "region": region,
                "city": None,
                "type": "Point",
                "address": f"Ubicación central de {file_name}",
                "searchable_text": f"{file_name} {region}".lower(),
                "created_at": kmz.get("created_at", "2026-02-23T00:00:00Z"),
            }
            
            locations_batch.append(location)
            total_locations_created += 1
            
        except Exception as e:
            print(f"[v0] Error processing bounds for {file_name}: {str(e)}")
    else:
        # If no bounds, create a placeholder location
        location = {
            "kmz_id": kmz_id,
            "name": file_name,
            "latitude": -40.0,  # Default to central Chile
            "longitude": -71.0,
            "region": region,
            "city": None,
            "type": "Point",
            "address": f"Ubicación central de {file_name}",
            "searchable_text": f"{file_name} {region}".lower(),
            "created_at": kmz.get("created_at", "2026-02-23T00:00:00Z"),
        }
        
        locations_batch.append(location)
        total_locations_created += 1

# Insert all locations in batch
if locations_batch:
    print(f"[v0] Inserting {len(locations_batch)} locations into kmz_location_index...")
    
    # Insert in chunks of 100 to avoid rate limits
    chunk_size = 100
    for i in range(0, len(locations_batch), chunk_size):
        chunk = locations_batch[i : i + chunk_size]
        try:
            insert_response = supabase.table("kmz_location_index").insert(chunk).execute()
            print(f"[v0] ✓ Inserted chunk {i//chunk_size + 1} ({len(chunk)} locations)")
        except Exception as e:
            print(f"[v0] ERROR inserting chunk {i//chunk_size + 1}: {str(e)}")

print(f"[v0] ✓ Completed! Created {total_locations_created} searchable locations from {len(kmz_files)} KMZ files")
