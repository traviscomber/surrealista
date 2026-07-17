param(
  [string]$SupabaseUrl = "https://jvgbrmqsiexwlqsyrwdx.supabase.co",
  [string]$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY,
  [ValidateSet("invalid", "empty", "all")]
  [string]$Mode = "all",
  [int]$Limit = 50,
  [int]$PageSize = 1000
)

$ErrorActionPreference = "Stop"

if (-not $SupabaseUrl -or -not $SupabaseKey) {
  throw "Missing SupabaseUrl or SupabaseKey"
}

function Normalize-Role($role) {
  if ($null -eq $role) { return $null }
  $normalized = "$role".Trim().ToUpperInvariant()
  if (-not $normalized) { return $null }
  return $normalized
}

function Test-ResearchableRole($role) {
  $normalized = Normalize-Role $role
  if (-not $normalized) { return $false }

  $parts = @($normalized -split '-' | Where-Object { $_ })
  if ($parts.Count -ne 3) { return $false }

  return $parts[0] -match '^\d{4,5}$' -and $parts[1] -match '^\d{1,5}[A-Z]?$' -and $parts[2] -match '^\d{1,5}[A-Z]?$'
}

function Invoke-SupabaseGetJson([string]$Url, [string]$Key) {
  $responseText = & curl.exe -sS `
    -H "apikey: $Key" `
    -H "Authorization: Bearer $Key" `
    -H "Accept: application/json" `
    $Url

  if ($LASTEXITCODE -ne 0) {
    throw "curl failed for $Url"
  }

  if (-not $responseText) {
    return @()
  }

  $parsed = $responseText | ConvertFrom-Json
  if ($parsed -is [System.Array]) {
    return $parsed
  }

  return @($parsed)
}

$offset = 0
$results = New-Object System.Collections.Generic.List[object]

while ($true) {
  $url = "$($SupabaseUrl.TrimEnd('/'))/rest/v1/kmz_collection?select=id,file_name,rol_numbers,region,metadata&is_active=eq.true&limit=$PageSize&offset=$offset"
  $page = @(Invoke-SupabaseGetJson -Url $url -Key $SupabaseKey)

  foreach ($row in $page) {
    if ($results.Count -ge $Limit) { break }

    $allRoles = @($row.rol_numbers | ForEach-Object { Normalize-Role $_ } | Where-Object { $_ })
    $validRoles = @($allRoles | Where-Object { Test-ResearchableRole $_ } | Select-Object -Unique)

    if ($validRoles.Count -gt 0) {
      continue
    }

    $classification = if ($allRoles.Count -gt 0) { "invalid" } else { "empty" }
    if ($Mode -ne "all" -and $Mode -ne $classification) {
      continue
    }

    [void]$results.Add([pscustomobject]@{
      id = $row.id
      file = $row.file_name
      region = $row.region
      classification = $classification
      rol_numbers = $allRoles
      metadataName = $row.metadata.name
    })
  }

  if ($results.Count -ge $Limit -or $page.Count -lt $PageSize) {
    break
  }

  $offset += $PageSize
}

$results | ConvertTo-Json -Depth 8
