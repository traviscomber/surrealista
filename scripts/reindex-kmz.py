#!/usr/bin/env python3
import os
import json
import zipfile
import xml.etree.ElementTree as ET
from io import BytesIO
import requests
from datetime import datetime

# Supabase connection
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[v0] Error: Missing Supabase credentials")
    exit(1)

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def fetch_kmz_collection():
    """Get all KMZ files from kmz_collection"""
    url = f"{SUPABASE_URL}/rest/v1/kmz_collection?is_active=eq.true"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"[v0] Error fetching KMZ collection: {response.status_code}")
        return []
    return response.json()

def extract_placemarks_from_kmz(kmz_url):
    """Extract placemarks from a KMZ file URL"""
    try:
        # Download KMZ
        kmz_response = requests.get(kmz_url, timeout=10)
        if kmz_response.status_code != 200:
            print(f"[v0] Could not download KMZ from {kmz_url}")
            return []
        
        # KMZ is a ZIP file
        kmz_zip = zipfile.ZipFile(BytesIO(kmz_response.content))
        
        # Find doc.kml inside
        kml_file = None
        for name in kmz_zip.namelist():
            if name.endswith('.kml'):
                kml_file = name
                break
        
        if not kml_file:
            print(f"[v0] No KML file found in KMZ")
            return []
        
        # Parse KML
        kml_data = kmz_zip.read(kml_file)
        root = ET.fromstring(kml_data)
        
        # Extract placemarks
        placemarks = []
        namespaces = {'kml': 'http://www.opengis.net/kml/2.2'}
        
        for placemark in root.findall('.//kml:Placemark', namespaces):
            name_elem = placemark.find('kml:name', namespaces)
            desc_elem = placemark.find('kml:description', namespaces)
            
            name = name_elem.text if name_elem is not None else "Unnamed"
            description = desc_elem.text if desc_elem is not None else ""
            
            # Try to extract coordinates
            coords = None
            
            # Point
            point = placemark.find('.//kml:Point/kml:coordinates', namespaces)
            if point is not None and point.text:
                coords_text = point.text.strip()
                coords_parts = coords_text.split(',')
                if len(coords_parts) >= 2:
                    coords = [float(coords_parts[0]), float(coords_parts[1])]
            
            # LineString
            if not coords:
                linestring = placemark.find('.//kml:LineString/kml:coordinates', namespaces)
                if linestring is not None and linestring.text:
                    coords_text = linestring.text.strip().split()[0]
                    coords_parts = coords_text.split(',')
                    if len(coords_parts) >= 2:
                        coords = [float(coords_parts[0]), float(coords_parts[1])]
            
            # Polygon
            if not coords:
                polygon = placemark.find('.//kml:Polygon/kml:outerBoundaryIs/kml:LinearRing/kml:coordinates', namespaces)
                if polygon is not None and polygon.text:
                    coords_text = polygon.text.strip().split()[0]
                    coords_parts = coords_text.split(',')
                    if len(coords_parts) >= 2:
                        coords = [float(coords_parts[0]), float(coords_parts[1])]
            
            if coords:
                placemarks.append({
                    'name': name,
                    'description': description,
                    'coordinates': coords
                })
        
        return placemarks
    except Exception as e:
        print(f"[v0] Error extracting placemarks: {str(e)}")
        return []

def insert_locations(kmz_id, kmz_file_name, placemarks):
    """Insert locations into kmz_location_index"""
    if not placemarks:
        return 0
    
    locations_to_insert = []
    for placemark in placemarks:
        locations_to_insert.append({
            'kmz_id': kmz_id,
            'name': placemark['name'],
            'latitude': placemark['coordinates'][1],
            'longitude': placemark['coordinates'][0],
            'type': 'Point',
            'searchable_text': f"{placemark['name']} {placemark['description']} {kmz_file_name}".lower(),
            'address': placemark['description'] if placemark['description'] else None,
            'region': None,
            'city': None,
            'created_at': datetime.utcnow().isoformat()
        })
    
    # Insert via Supabase
    url = f"{SUPABASE_URL}/rest/v1/kmz_location_index"
    
    for location in locations_to_insert:
        response = requests.post(url, json=location, headers=headers)
        if response.status_code not in [200, 201]:
            print(f"[v0] Error inserting location: {response.status_code} - {response.text}")
    
    return len(locations_to_insert)

# Main re-indexing
print("[v0] Starting KMZ re-indexing...")
kmz_files = fetch_kmz_collection()
print(f"[v0] Found {len(kmz_files)} KMZ files to re-index")

total_locations = 0
for kmz in kmz_files:
    kmz_id = kmz.get('id')
    kmz_name = kmz.get('file_name')
    kmz_url = kmz.get('file_path')
    
    print(f"[v0] Processing: {kmz_name}")
    
    # For offline files, skip (they don't have URL)
    if not kmz_url or kmz_url.startswith('offline/'):
        print(f"[v0] Skipping offline file: {kmz_name}")
        continue
    
    placemarks = extract_placemarks_from_kmz(kmz_url)
    indexed = insert_locations(kmz_id, kmz_name, placemarks)
    
    print(f"[v0] ✓ Indexed {indexed} locations from {kmz_name}")
    total_locations += indexed

print(f"[v0] ✓ Re-indexing complete! Total locations indexed: {total_locations}")
