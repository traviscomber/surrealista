param(
  [string]$SupabaseUrl = "https://jvgbrmqsiexwlqsyrwdx.supabase.co",
  [string]$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY,
  [int]$DryRun = 1,
  [int]$PageSize = 500,
  [int]$Limit = 500
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
    throw "curl GET failed for $Url"
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

function Invoke-SupabasePatchJson([string]$Url, [string]$Key, [string]$Body) {
  $tmpPath = Join-Path $env:TEMP ("cleanup-invalid-kmz-" + [guid]::NewGuid().ToString() + ".json")
  [System.IO.File]::WriteAllText($tmpPath, $Body, [System.Text.UTF8Encoding]::new($false))

  try {
    $responseText = & curl.exe -sS `
      -X PATCH `
      -H "apikey: $Key" `
      -H "Authorization: Bearer $Key" `
      -H "Content-Type: application/json" `
      -H "Prefer: return=representation" `
      --data-binary "@$tmpPath" `
      $Url
  } finally {
    Remove-Item -LiteralPath $tmpPath -Force -ErrorAction SilentlyContinue
  }

  if ($LASTEXITCODE -ne 0) {
    throw "curl PATCH failed for $Url"
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
$processed = 0
$cleaned = New-Object System.Collections.Generic.List[object]

while ($true) {
  $url = "$($SupabaseUrl.TrimEnd('/'))/rest/v1/kmz_collection?select=id,file_name,rol_numbers,metadata&is_active=eq.true&limit=$PageSize&offset=$offset"
  $page = @(Invoke-SupabaseGetJson -Url $url -Key $SupabaseKey)

  foreach ($row in $page) {
    if ($processed -ge $Limit) { break }

    $allRoles = @($row.rol_numbers | ForEach-Object { Normalize-Role $_ } | Where-Object { $_ })
    $validRoles = @($allRoles | Where-Object { Test-ResearchableRole $_ } | Select-Object -Unique)
    if ($validRoles.Count -gt 0 -or $allRoles.Count -eq 0) {
      continue
    }

    $processed++
    $metadata = if ($row.metadata) { $row.metadata } else { @{} }
    $queue = $metadata.owner_research_queue
    $queuePrimaryRol = $queue.primaryRol
    $queueNeedsReset = $queuePrimaryRol -and -not (Test-ResearchableRole $queuePrimaryRol)

    $nextMetadata = $metadata.PSObject.Copy()
    if ($queueNeedsReset) {
      $nextMetadata.PSObject.Properties.Remove("owner_research_queue")
    }

    $payload = @{
      rol_numbers = @()
      metadata = $nextMetadata
    } | ConvertTo-Json -Depth 30

    if ($DryRun -eq 0) {
      $patchUrl = "$($SupabaseUrl.TrimEnd('/'))/rest/v1/kmz_collection?id=eq.$($row.id)"
      [void](Invoke-SupabasePatchJson -Url $patchUrl -Key $SupabaseKey -Body $payload)
    }

    [void]$cleaned.Add([pscustomobject]@{
      id = $row.id
      file = $row.file_name
      removedRoles = $allRoles
      resetOwnerQueue = [bool]$queueNeedsReset
    })
  }

  if ($processed -ge $Limit -or $page.Count -lt $PageSize) {
    break
  }

  $offset += $PageSize
}

Write-Output ("dryRun={0}" -f ($DryRun -ne 0))
Write-Output ("processed={0}" -f $processed)
foreach ($item in $cleaned) {
  Write-Output ("{0}`t{1}`t{2}`t{3}" -f $item.id, $item.file, ($item.removedRoles -join ","), $item.resetOwnerQueue)
}
