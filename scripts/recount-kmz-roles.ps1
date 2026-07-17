param(
  [string]$SupabaseUrl = "https://jvgbrmqsiexwlqsyrwdx.supabase.co",
  [string]$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY,
  [int]$PageSize = 1000,
  [int]$SampleInvalid = 20,
  [int]$SampleUnresolved = 20
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
$total = 0
$withValidRole = 0
$withOnlyInvalidRole = 0
$withNoRoles = 0
$invalidRoleSamples = New-Object System.Collections.Generic.List[object]
$unresolvedSamples = New-Object System.Collections.Generic.List[object]
$pages = 0

while ($true) {
  $url = "$($SupabaseUrl.TrimEnd('/'))/rest/v1/kmz_collection?select=id,file_name,rol_numbers,region&is_active=eq.true&limit=$PageSize&offset=$offset"
  $page = @(Invoke-SupabaseGetJson -Url $url -Key $SupabaseKey)
  $count = $page.Count
  $pages++

  foreach ($row in $page) {
    $total++

    $allRoles = @($row.rol_numbers | ForEach-Object { Normalize-Role $_ } | Where-Object { $_ })
    $validRoles = @($allRoles | Where-Object { Test-ResearchableRole $_ } | Select-Object -Unique)
    $invalidRoles = @($allRoles | Where-Object { -not (Test-ResearchableRole $_) } | Select-Object -Unique)

    if ($validRoles.Count -gt 0) {
      $withValidRole++
      continue
    }

    if ($allRoles.Count -gt 0) {
      $withOnlyInvalidRole++
      if ($invalidRoleSamples.Count -lt $SampleInvalid) {
        [void]$invalidRoleSamples.Add([pscustomobject]@{
          id = $row.id
          file = $row.file_name
          region = $row.region
          invalidRoles = $invalidRoles
        })
      }
    } else {
      $withNoRoles++
    }

    if ($unresolvedSamples.Count -lt $SampleUnresolved) {
      [void]$unresolvedSamples.Add([pscustomobject]@{
        id = $row.id
        file = $row.file_name
        region = $row.region
        rol_numbers = $allRoles
      })
    }
  }

  if ($count -lt $PageSize) {
    break
  }

  $offset += $PageSize
}

$generatedAt = (Get-Date).ToString("o")
$unresolvedCount = $total - $withValidRole
$result = New-Object PSObject
$result | Add-Member -NotePropertyName generatedAt -NotePropertyValue $generatedAt
$result | Add-Member -NotePropertyName pages -NotePropertyValue $pages
$result | Add-Member -NotePropertyName total -NotePropertyValue $total
$result | Add-Member -NotePropertyName withValidRole -NotePropertyValue $withValidRole
$result | Add-Member -NotePropertyName unresolved -NotePropertyValue $unresolvedCount
$result | Add-Member -NotePropertyName withOnlyInvalidRole -NotePropertyValue $withOnlyInvalidRole
$result | Add-Member -NotePropertyName withNoRoles -NotePropertyValue $withNoRoles
$result | ConvertTo-Json -Depth 4
