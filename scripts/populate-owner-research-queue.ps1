param(
  [string]$BaseUrl,
  [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
  [string]$SupabaseKey = $(if ($env:SUPABASE_SERVICE_ROLE_KEY) { $env:SUPABASE_SERVICE_ROLE_KEY } else { $env:NEXT_PUBLIC_SUPABASE_ANON_KEY }),
  [switch]$DryRun,
  [switch]$ForceRefresh,
  [switch]$OnlyMissingOwner = $true,
  [switch]$OnlyWithRole = $true,
  [int]$PageSize = 1000,
  [int]$Limit = 2500,
  [int]$Offset = 0
)

$ErrorActionPreference = "Stop"

if ($BaseUrl) {
  $targetBaseUrl = $BaseUrl.TrimEnd('/')
  $payload = @{
    limit = $Limit
    offset = $Offset
    persist = (-not $DryRun)
    dryRun = [bool]$DryRun
    forceRefresh = [bool]$ForceRefresh
    onlyMissingOwner = [bool]$OnlyMissingOwner
    onlyWithRole = [bool]$OnlyWithRole
  } | ConvertTo-Json -Depth 8

  $response = Invoke-RestMethod `
    -Method Post `
    -Uri "$targetBaseUrl/api/admin/kmz/owner-research-queue" `
    -ContentType "application/json" `
    -Body $payload `
    -TimeoutSec 180

  $response | ConvertTo-Json -Depth 10
  return
}

if (-not $SupabaseUrl -or -not $SupabaseKey) {
  throw "Missing Supabase environment variables, or pass -BaseUrl https://your-app"
}

$southPriorityRegions = @(
  "Región de La Araucanía",
  "Región de Los Ríos",
  "Región de Los Lagos",
  "Región de Aysén",
  "Región de Magallanes y de la Antártica Chilena",
  "Región del Biobío",
  "Región de Ñuble"
)

$companyHintPattern = '\b(SPA|S\.A\.|LTDA|LIMITADA|EIRL|SOCIEDAD|INVERSIONES|AGRICOLA|AGRO|FORESTAL|INMOBILIARIA|EXPORTADORA|PESQUERA)\b'
$southPriorityRegionKeys = @(
  "araucania",
  "los rios",
  "los lagos",
  "aysen",
  "magallanes y de la antartica chilena",
  "biobio",
  "nuble"
)
$recentResolutionWindowDays = 14
$headers = @{
  apikey = $SupabaseKey
  Authorization = "Bearer $SupabaseKey"
  "Content-Type" = "application/json"
}

function Normalize-Region($value) {
  if ($null -eq $value) { return "" }
  return "$value".Trim()
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

function Get-ResearchableRoles($roles) {
  $seen = New-Object 'System.Collections.Generic.HashSet[string]'
  $result = New-Object System.Collections.Generic.List[string]

  foreach ($role in @($roles)) {
    $normalized = Normalize-Role $role
    if ($normalized -and (Test-ResearchableRole $normalized) -and $seen.Add($normalized)) {
      [void]$result.Add($normalized)
    }
  }

  return @($result)
}

function Convert-ToRegionKey($value) {
  $text = Normalize-Region $value
  if (-not $text) { return "" }

  $normalized = $text.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $plain = $builder.ToString().ToLowerInvariant()
  $plain = $plain -replace '^region\s+de\s+', ''
  $plain = $plain -replace '^region\s+del\s+', ''
  $plain = $plain -replace '\s+', ' '
  return $plain.Trim()
}

function Convert-ToCanonicalSouthRegionKey($value) {
  $key = Convert-ToRegionKey $value
  if (-not $key) { return "" }
  if ($key.Contains("araucan")) { return "araucania" }
  if ($key.Contains("los rios")) { return "los rios" }
  if ($key.Contains("los lagos")) { return "los lagos" }
  if ($key.Contains("aysen") -or $key.Contains("ibanez")) { return "aysen" }
  if ($key.Contains("magallanes")) { return "magallanes y de la antartica chilena" }
  if ($key.Contains("bio bio") -or $key.Contains("biobio")) { return "biobio" }
  if ($key.Contains("nuble")) { return "nuble" }
  return $key
}

function Get-RecentResolutionInfo($metadata) {
  $resolvedAtCandidates = @()
  if ($metadata -and $metadata.manual_role_assignment -and $metadata.manual_role_assignment.assigned_at) {
    $resolvedAtCandidates += [pscustomobject]@{
      value = $metadata.manual_role_assignment.assigned_at
      source = "manual-role-assignment"
    }
  }
  if ($metadata -and $metadata.sii_point_resolution -and $metadata.sii_point_resolution.resolved_at) {
    $resolvedAtCandidates += [pscustomobject]@{
      value = $metadata.sii_point_resolution.resolved_at
      source = "sii-point-resolution"
    }
  }

  if ($resolvedAtCandidates.Count -eq 0) {
    return @{
      resolvedAt = $null
      resolvedRecently = $false
      resolutionSource = $null
    }
  }

  $parsedCandidates = foreach ($candidate in $resolvedAtCandidates) {
    try {
      [pscustomobject]@{
        value = $candidate.value
        source = $candidate.source
        date = [DateTimeOffset]::Parse("$($candidate.value)")
      }
    } catch {
      $null
    }
  }

  $latestCandidate = @($parsedCandidates | Sort-Object { $_.date.ToUnixTimeMilliseconds() } -Descending | Select-Object -First 1)[0]
  if (-not $latestCandidate) {
    return @{
      resolvedAt = $null
      resolvedRecently = $false
      resolutionSource = $null
    }
  }

  $age = [DateTimeOffset]::UtcNow - $latestCandidate.date.ToUniversalTime()
  $recentWindow = [TimeSpan]::FromDays($recentResolutionWindowDays)

  return @{
    resolvedAt = $latestCandidate.date.ToString("o")
    resolvedRecently = ($age.TotalMilliseconds -ge 0 -and $age -le $recentWindow)
    resolutionSource = $latestCandidate.source
  }
}

function Build-SearchQueries($fileName, $region, $roles) {
  $cleanName = ($fileName -replace '\.kmz$','' -replace '[()]',' ' -replace '\s+',' ').Trim()
  $role = if ($roles -and $roles.Count -gt 0) { $roles[0] } else { $null }
  $regionLabel = Normalize-Region $region
  $queries = @(
    $(if ($role) { "rol $role" }),
    $(if ($role) { "`"$role`" `"$cleanName`"" }),
    $(if ($role -and $regionLabel) { "`"$role`" `"$regionLabel`"" }),
    $(if ($role) { "`"$role`" sociedad OR limitada OR spa OR sa" }),
    $(if ($role) { "`"$role`" propietario OR dueño OR dueno" })
  ) | Where-Object { $_ }

  return $queries | Select-Object -Unique | Select-Object -First 5
}

function Get-QueueStatus($record) {
  if ($record.owner -and "$($record.owner)".Trim()) { return "confirmed" }

  $metadata = $record.metadata
  if ($metadata -and ($metadata.latest_cbr_owner_record -or ($metadata.cbr_owner_records -and $metadata.cbr_owner_records.Count -gt 0))) {
    return "confirmed"
  }

  if ($metadata -and ($metadata.public_owner_candidate -or $metadata.latest_owner_evidence)) {
    return "evidence-found"
  }

  return "pending"
}

function Get-PriorityTier([int]$score) {
  if ($score -ge 90) { return "critical" }
  if ($score -ge 70) { return "high" }
  if ($score -ge 45) { return "medium" }
  return "low"
}

function New-QueueEntry($record, $roleFrequency) {
  $metadata = if ($record.metadata) { $record.metadata } else { [pscustomobject]@{} }
  $roles = @(Get-ResearchableRoles $record.rol_numbers)
  $primaryRol = if ($roles.Count -gt 0) { $roles[0] } else { $null }
  $region = Normalize-Region $record.region
  $hasPublicCandidate = [bool]$metadata.public_owner_candidate
  $hasEvidenceRecords = [bool]($metadata.owner_evidence_records -and $metadata.owner_evidence_records.Count -gt 0)
  $hasGoogleDocsLink = [bool]($record.google_docs_link -and "$($record.google_docs_link)".Trim())
  $hasCbrRecord = [bool]($metadata.latest_cbr_owner_record -or ($metadata.cbr_owner_records -and $metadata.cbr_owner_records.Count -gt 0))
  $recentResolution = Get-RecentResolutionInfo $metadata
  $southFocus = $southPriorityRegionKeys -contains (Convert-ToCanonicalSouthRegionKey $region)
  $duplicateRoleCount = if ($primaryRol -and $roleFrequency.ContainsKey($primaryRol)) { [int]$roleFrequency[$primaryRol] } else { 1 }
  $fileNameText = if ($null -ne $record.file_name) { [string]$record.file_name } else { "" }
  $publicCandidateJson = if ($null -ne $metadata.public_owner_candidate) { ($metadata.public_owner_candidate | ConvertTo-Json -Compress -Depth 8) } else { "" }
  $companyHint = [regex]::IsMatch($fileNameText, $companyHintPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase) -or [regex]::IsMatch($publicCandidateJson, $companyHintPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

  $priorityScore = 0
  $reasons = New-Object System.Collections.Generic.List[string]

  if ($roles.Count -gt 0) {
    $priorityScore += 35
    [void]$reasons.Add("Tiene rol SII resuelto")
  }

  $queueStatus = Get-QueueStatus $record
  if ($queueStatus -eq "pending") {
    $priorityScore += 12
    [void]$reasons.Add("Aun no tiene investigacion de dueño o sociedad")
  } elseif ($queueStatus -eq "evidence-found") {
    $priorityScore += 8
    [void]$reasons.Add("Ya existe pista publica; falta validacion")
  }

  if ($roles.Count -eq 1) {
    $priorityScore += 10
    [void]$reasons.Add("Tiene un rol principal claro")
  } elseif ($roles.Count -gt 1) {
    $priorityScore += 4
    [void]$reasons.Add("Tiene multiples roles que pueden requerir desambiguacion")
  }

  if ($southFocus) {
    $priorityScore += 18
    [void]$reasons.Add("Pertenece a una region prioritaria del sur")
  }

  if ($duplicateRoleCount -gt 1) {
    $priorityScore += [Math]::Min($duplicateRoleCount * 4, 20)
    [void]$reasons.Add("Comparte rol con $($duplicateRoleCount - 1) KMZ mas")
  }

  if ($recentResolution.resolvedRecently) {
    $priorityScore += 14
    if ($recentResolution.resolutionSource -eq "manual-role-assignment") {
      [void]$reasons.Add("Rol asignado recientemente; conviene investigar mientras la pista esta fresca")
    } else {
      [void]$reasons.Add("Rol resuelto recientemente; conviene aprovechar la trazabilidad fresca")
    }
  }

  if ($hasPublicCandidate) {
    $priorityScore += 16
    [void]$reasons.Add("Ya existe candidato publico de dueño o sociedad")
  }

  if ($hasEvidenceRecords) {
    $priorityScore += 12
    [void]$reasons.Add("Ya existe evidencia publica acumulada")
  }

  if ($hasGoogleDocsLink) {
    $priorityScore += 8
    [void]$reasons.Add("Tiene link documental interno asociado")
  }

  if ($companyHint) {
    $priorityScore += 7
    [void]$reasons.Add("Hay indicios de sociedad en nombre o evidencia")
  }

  if (($record.placemarks_count | ForEach-Object { [int]$_ }) -le 3) {
    $priorityScore += 6
    [void]$reasons.Add("Predio acotado; investigacion mas rapida")
  }

  if ($hasCbrRecord -or ($record.owner -and "$($record.owner)".Trim())) {
    $priorityScore = 0
    $reasons.Clear()
    [void]$reasons.Add("Ya tiene dueño confirmado o respaldo CBR")
  }

  $status = $queueStatus

  return [ordered]@{
    status = $status
    priorityScore = $priorityScore
    priorityTier = Get-PriorityTier $priorityScore
    primaryRol = $primaryRol
    roleCount = $roles.Count
    duplicateRoleCount = $duplicateRoleCount
    southFocus = $southFocus
    hasPublicCandidate = $hasPublicCandidate
    hasEvidenceRecords = $hasEvidenceRecords
    hasGoogleDocsLink = $hasGoogleDocsLink
    hasConfirmedOwner = [bool]($record.owner -and "$($record.owner)".Trim()) -or $hasCbrRecord
    resolvedAt = $recentResolution.resolvedAt
    resolvedRecently = [bool]$recentResolution.resolvedRecently
    resolutionSource = $recentResolution.resolutionSource
    companyHint = $companyHint
    reasons = @($reasons)
    suggestedNextStep = $(if ($hasPublicCandidate -or $hasEvidenceRecords) { "Validar candidato en Google/CBR y registrar confirmacion si corresponde" } else { "Hacer busqueda web por rol exacto y registrar candidato antes de abrir CBR" })
    searchQueries = @(Build-SearchQueries $record.file_name $record.region $roles)
    generatedAt = (Get-Date).ToString("o")
    queueVersion = 2
  }
}

function Update-MetadataQueue($record, $queueEntry) {
  $metadata = if ($record.metadata) { $record.metadata } else { [pscustomobject]@{} }
  $metadata | Add-Member -NotePropertyName owner_research_queue -NotePropertyValue $queueEntry -Force
  return $metadata
}

function Invoke-SupabasePatchWithRetry {
  param(
    [string]$Uri,
    [string]$SupabaseKey,
    [string]$Body,
    [string]$RecordId,
    [int]$MaxAttempts = 5
  )

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    $tmpPath = Join-Path $env:TEMP ("owner-queue-" + $RecordId + "-" + $attempt + ".json")
    [System.IO.File]::WriteAllText($tmpPath, $Body, [System.Text.UTF8Encoding]::new($false))

    try {
      $curlOutput = & curl.exe -s -o - -w "HTTPSTATUS:%{http_code}" -X PATCH $Uri -H "apikey: $SupabaseKey" -H "Authorization: Bearer $SupabaseKey" -H "Content-Type: application/json" --data-binary "@$tmpPath"
    } finally {
      Remove-Item -LiteralPath $tmpPath -Force -ErrorAction SilentlyContinue
    }

    if ($curlOutput -match "HTTPSTATUS:204$") {
      return
    }

    if ($attempt -eq $MaxAttempts) {
      throw "PATCH failed for $RecordId after $MaxAttempts attempt(s): $curlOutput"
    }

    $delaySeconds = [Math]::Min([Math]::Pow(2, $attempt), 20)
    Write-Warning "PATCH transient failure for $RecordId on attempt $attempt/$MaxAttempts. Retrying in $delaySeconds second(s)."
    Start-Sleep -Seconds $delaySeconds
  }
}

$allRows = New-Object System.Collections.Generic.List[object]
$pageOffset = 0

while ($true) {
  $uri = "$SupabaseUrl/rest/v1/kmz_collection?select=id,file_name,region,owner,google_docs_link,placemarks_count,rol_numbers,metadata&is_active=eq.true&limit=$PageSize&offset=$pageOffset"
  $page = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers -TimeoutSec 120
  foreach ($row in $page) { [void]$allRows.Add($row) }
  if ((@($page).Count) -lt $PageSize) { break }
  $pageOffset += $PageSize
}

$allCandidates = @(
  $allRows | Where-Object {
    (Get-ResearchableRoles $_.rol_numbers).Count -gt 0 -and
    -not ($_.owner -and "$($_.owner)".Trim()) -and
    -not ($_.metadata -and ($_.metadata.latest_cbr_owner_record -or ($_.metadata.cbr_owner_records -and $_.metadata.cbr_owner_records.Count -gt 0))) -and
    ($ForceRefresh -or -not ($_.metadata -and $_.metadata.owner_research_queue))
  }
)

$candidateWindow = @($allCandidates | Select-Object -Skip $Offset -First $Limit)

$roleFrequency = @{}
foreach ($record in $allCandidates) {
  foreach ($role in @(Get-ResearchableRoles $record.rol_numbers)) {
    if (-not $roleFrequency.ContainsKey($role)) { $roleFrequency[$role] = 0 }
    $roleFrequency[$role]++
  }
}

$results = New-Object System.Collections.Generic.List[object]

foreach ($record in $candidateWindow) {
  $queueEntry = New-QueueEntry $record $roleFrequency
  if (-not $queueEntry.primaryRol) { continue }
  $nextMetadata = Update-MetadataQueue $record $queueEntry

  if (-not $DryRun) {
    $patchUri = "$SupabaseUrl/rest/v1/kmz_collection?id=eq.$($record.id)"
    $body = @{ metadata = $nextMetadata } | ConvertTo-Json -Depth 20
    Invoke-SupabasePatchWithRetry -Uri $patchUri -SupabaseKey $SupabaseKey -Body $body -RecordId $record.id
  }

  [void]$results.Add([pscustomobject]@{
    id = $record.id
    file_name = $record.file_name
    region = $record.region
    role = $queueEntry.primaryRol
    priorityScore = $queueEntry.priorityScore
    priorityTier = $queueEntry.priorityTier
    status = $queueEntry.status
    reasons = ($queueEntry.reasons -join "; ")
  })
}

$ordered = $results | Sort-Object @{ Expression = "priorityScore"; Descending = $true }, @{ Expression = "file_name"; Descending = $false }

$summary = [pscustomobject]@{
  dry_run = [bool]$DryRun
  force_refresh = [bool]$ForceRefresh
  total_active = $allRows.Count
  total_candidates = $allCandidates.Count
  selected_candidates = $candidateWindow.Count
  offset = $Offset
  limit = $Limit
  critical = (@($ordered | Where-Object { $_.priorityTier -eq "critical" }).Count)
  high = (@($ordered | Where-Object { $_.priorityTier -eq "high" }).Count)
  medium = (@($ordered | Where-Object { $_.priorityTier -eq "medium" }).Count)
  low = (@($ordered | Where-Object { $_.priorityTier -eq "low" }).Count)
}

$summary | ConvertTo-Json
$ordered | Select-Object -First 20 | ConvertTo-Json -Depth 6
