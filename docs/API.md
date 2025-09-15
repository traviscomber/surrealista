# API Documentation

Complete API reference for Sur-Realista backend services.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most API endpoints require authentication. Include the authorization header:

\`\`\`http
Authorization: Bearer <your-jwt-token>
\`\`\`

## API Versioning

Current API version: `v1`

All endpoints are prefixed with `/api/v1/`

## Endpoints

### Authentication

#### POST /api/v1/auth/session
Get current user session information.

**Response:**
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "agent",
    "profile": {
      "name": "John Doe",
      "avatar_url": "https://..."
    }
  },
  "session": {
    "access_token": "jwt-token",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
\`\`\`

### Properties

#### GET /api/v1/properties
List properties with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term
- `type` (string): Property type filter
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `location` (string): Location filter

**Response:**
\`\`\`json
{
  "properties": [
    {
      "id": "uuid",
      "title": "Beautiful House",
      "description": "A lovely property...",
      "price": 250000,
      "type": "house",
      "bedrooms": 3,
      "bathrooms": 2,
      "square_meters": 120,
      "location": {
        "address": "123 Main St",
        "city": "Santiago",
        "region": "Metropolitana",
        "coordinates": [-70.6483, -33.4569]
      },
      "images": ["url1", "url2"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
\`\`\`

#### GET /api/v1/properties/[id]
Get a specific property by ID.

**Response:**
\`\`\`json
{
  "id": "uuid",
  "title": "Beautiful House",
  "description": "A lovely property...",
  "price": 250000,
  "type": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "square_meters": 120,
  "location": {
    "address": "123 Main St",
    "city": "Santiago",
    "region": "Metropolitana",
    "coordinates": [-70.6483, -33.4569]
  },
  "images": ["url1", "url2"],
  "features": ["parking", "garden", "pool"],
  "agent": {
    "id": "uuid",
    "name": "Agent Name",
    "email": "agent@example.com",
    "phone": "+56912345678"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
\`\`\`

#### POST /api/v1/properties
Create a new property (Admin/Agent only).

**Request Body:**
\`\`\`json
{
  "title": "Beautiful House",
  "description": "A lovely property...",
  "price": 250000,
  "type": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "square_meters": 120,
  "location": {
    "address": "123 Main St",
    "city": "Santiago",
    "region": "Metropolitana"
  },
  "features": ["parking", "garden"],
  "images": ["base64-image-data"]
}
\`\`\`

#### PUT /api/v1/properties/[id]
Update a property (Admin/Agent only).

#### DELETE /api/v1/properties/[id]
Delete a property (Admin only).

### Integrations

#### GET /api/v1/integrations/sii
Query SII (Servicio de Impuestos Internos) for property tax information.

**Query Parameters:**
- `rut` (string): Property owner RUT
- `property_id` (string): Internal property ID

**Response:**
\`\`\`json
{
  "property_tax": {
    "annual_amount": 1200000,
    "last_payment": "2024-01-15",
    "status": "paid",
    "property_value": 80000000
  },
  "owner": {
    "rut": "12345678-9",
    "name": "Property Owner"
  }
}
\`\`\`

#### GET /api/v1/integrations/sirene
Query SIRENE for property registry information.

**Query Parameters:**
- `address` (string): Property address
- `commune` (string): Commune name

**Response:**
\`\`\`json
{
  "registry": {
    "property_id": "12345",
    "legal_description": "Property legal description",
    "lot_number": "123",
    "block_number": "45",
    "total_area": 500,
    "built_area": 120
  },
  "ownership": {
    "current_owner": "Owner Name",
    "acquisition_date": "2020-01-01",
    "deed_number": "12345"
  }
}
\`\`\`

### AI Services

#### POST /api/v1/ai/analyze-property
Analyze property using AI.

**Request Body:**
\`\`\`json
{
  "property_id": "uuid",
  "analysis_type": "market_value" | "investment_potential" | "description_enhancement"
}
\`\`\`

**Response:**
\`\`\`json
{
  "analysis": {
    "type": "market_value",
    "result": {
      "estimated_value": 280000,
      "confidence": 0.85,
      "factors": [
        "Location premium: +15%",
        "Recent renovations: +10%",
        "Market trend: +5%"
      ]
    },
    "recommendations": [
      "Consider pricing at $275,000-$285,000",
      "Highlight recent renovations in listing"
    ]
  },
  "generated_at": "2024-01-01T00:00:00Z"
}
\`\`\`

## Error Handling

All API endpoints return consistent error responses:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "price",
      "issue": "Must be a positive number"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

### Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited:
- **Authenticated users**: 1000 requests/hour
- **Anonymous users**: 100 requests/hour
- **AI endpoints**: 50 requests/hour

## SDKs and Examples

### JavaScript/TypeScript

\`\`\`typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get properties
const { data: properties, error } = await supabase
  .from('properties')
  .select('*')
  .limit(20);
\`\`\`

### cURL Examples

\`\`\`bash
# Get properties
curl -X GET "https://your-domain.com/api/v1/properties" \
  -H "Authorization: Bearer your-jwt-token"

# Create property
curl -X POST "https://your-domain.com/api/v1/properties" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Property",
    "price": 300000,
    "type": "apartment"
  }'
\`\`\`

---

*For more examples and detailed integration guides, see the [User Guides](./user-guides/).*
