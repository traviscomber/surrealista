# SII role resolution

## Sources reviewed

### BaseAPI Mapas SII

Public page: `https://baseapi.cl/servicios/mapas-sii`

BaseAPI documents the following SII catastro contract on `https://api.baseapi.cl/docs/client`.
The public marketing page omits the API prefix, but the OpenAPI contract uses
`https://api.baseapi.cl/api/v1` as the production base URL:

- `GET /api/v1/sii/avaluo/predio/{comuna}/{manzana}/{predio}`
- `GET /api/v1/sii/avaluo/buscar`
- `GET /api/v1/sii/avaluo/area-homogenea`
- `GET /api/v1/sii/avaluo/comunas/{comuna}/areas-homogeneas`
- `GET /api/v1/sii/avaluo/comunas/{comuna}/servicios`
- `GET /api/v1/sii/avaluo/reavaluos`
- `GET /api/v1/sii/avaluo/destinos`
- `GET /api/v1/sii/avaluo/regiones`

Their own copy says the source is public `Mapas SII` catastro data and that no
taxpayer SII credentials are required. The API itself is not anonymous: the
OpenAPI security scheme requires an `X-API-Key` header. Direct unauthenticated
requests to the confirmed routes return `401`.

Implementation in this repo:

- `BASEAPI_API_KEY`: required for live BaseAPI calls.
- `BASEAPI_BASE_URL`: optional, defaults to `https://api.baseapi.cl/api/v1`.
- `lib/sii/baseapi-client.ts`: provider implementation.
- `app/api/sii/explore/route.ts`: existing UI endpoint, now backed by BaseAPI instead of mock data.

### SII official

Public pages:

- `https://www4.sii.cl/mapasui/internet/`
- `https://www.sii.cl/servicios_online/1048-2569.html`

The official semestral role app redirects to SII authentication in the tested flow. That makes it unsuitable for unattended scraping unless the user provides and maintains an authenticated browser/session. The implementation therefore does not attempt to bypass that gate.

SII Mapas exposes the public Angular data services used by the map UI. These
services are not BaseAPI and do not require a BaseAPI key:

- `POST https://www4.sii.cl/mapasui/services/data/mapasFacadeService/getPrediosDireccion`
- `POST https://www4.sii.cl/mapasui/services/data/mapasFacadeService/getPredioNacional`

Both use the SII Angular envelope:

```json
{
  "metaData": {
    "namespace": "cl.sii.sdi.lob.bbrr.mapas.data.api.interfaces.MapasFacadeService/getPredioNacional",
    "conversationId": "uuid",
    "transactionId": "uuid",
    "page": null
  },
  "data": {}
}
```

Implementation in this repo:

- `lib/sii/sii-mapas-public-client.ts`: public SII Mapas provider.
- `app/api/sii/explore/route.ts`: uses BaseAPI when configured, otherwise SII Mapas public.
- `app/api/sii/roles/resolve/route.ts`: same provider fallback.

### TGR / Tesoreria

Public page: `https://web.tesoreria.cl/contribuciones/`

TGR is useful for payment/debt/contribution validation by role, but it is not the primary source for discovering roles from a KMZ geometry. Use it as a second validation provider after a role is known.

## Resolution pipeline

1. Extract roles already present inside the KMZ.

   Source fields:

   - KMZ file name
   - placemark `name`
   - placemark `description`
   - placemark `ExtendedData`
   - existing `kmz_collection.metadata`

2. Persist the extracted roles into `kmz_collection.rol_numbers`.

   Endpoint:

   ```http
   POST /api/admin/kmz/extract-roles
   ```

   Example:

   ```json
   {
     "limit": 100,
     "dryRun": true,
     "onlyMissing": true
   }
   ```

3. Resolve a specific KMZ, address, or role.

   Endpoint:

   ```http
   POST /api/sii/roles/resolve
   ```

   Example KMZ lookup:

   ```json
   {
     "kmzId": "00000000-0000-0000-0000-000000000000",
     "persist": true
   }
   ```

   Example address lookup through BaseAPI:

   ```json
   {
     "address": {
       "comuna": "13101",
       "calle": "ALAMEDA LIB. B. OHIGGINS",
       "numero": "3"
     }
   }
   ```

   If `BASEAPI_API_KEY` is not configured, this same request uses the public
   SII Mapas `getPrediosDireccion` endpoint instead.

   Example direct role lookup through BaseAPI:

   ```json
   {
     "rol": "13101-1-1"
   }
   ```

   If `BASEAPI_API_KEY` is not configured, this same request uses the public
   SII Mapas `getPredioNacional` endpoint instead.

## Notes

- For BaseAPI role lookup, the `rol` must include the comuna code: `comuna-manzana-predio`.
- KMZ-only extraction can find roles such as `140-2024`, `ROL: 140-2024`, `manzana 140 predio 2024`, and labelled variants.
- If the KMZ only contains polygon coordinates and no address/role text, a separate reverse-geocoding step is required before address-based SII lookup.
