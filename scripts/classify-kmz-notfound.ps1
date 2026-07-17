param(
  [string]$RunDir = "C:\Users\juanf\Documents\Codex\2026-07-15\sur\work\kmz-role-runs-fresh"
)

$ErrorActionPreference = "Stop"

$knownManualResolutions = @(
  "30c98b09-08d9-4a50-b3da-03f12e23dabc",
  "69766574-5fbd-489c-84c9-9ba8a0e12600",
  "34b30524-6ecb-4609-80cd-62b9d9b1c821",
  "701bcf8e-3b31-40b7-aec3-89a12c2c5078",
  "447e85c5-9659-41ae-a023-1a9851d37686"
)

function Get-NormalizedBaseName([string]$value) {
  if (-not $value) { return "" }

  $normalized = $value -replace '\.kmz$',''
  $normalized = $normalized -replace '\(\d+\)',''
  $normalized = $normalized.Normalize([Text.NormalizationForm]::FormD)

  $builder = New-Object System.Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  return (($builder.ToString() -replace '[^A-Za-z0-9 ]',' ' -replace '\s+',' ').Trim().ToUpperInvariant())
}

function Get-CurrentEntries {
  $entries = New-Object System.Collections.Generic.List[object]
  Get-ChildItem -LiteralPath $RunDir -Filter "*.jsonl" -ErrorAction SilentlyContinue | ForEach-Object {
    Get-Content -LiteralPath $_.FullName | ForEach-Object {
      if (-not $_.Trim()) { return }

      try {
        $row = $_ | ConvertFrom-Json
        if (-not $row.id -or -not $row.fileName) { return }

        $entries.Add([pscustomobject]@{
          id = $row.id
          fileName = $row.fileName
          status = $row.status
          row = $row
          baseName = Get-NormalizedBaseName $row.fileName
        }) | Out-Null
      } catch {}
    }
  }

  $statusPriority = @{
    "persisted" = 3
    "error" = 2
    "not_found" = 1
  }

  $currentById = @{}
  foreach ($entry in $entries) {
    if ($knownManualResolutions -contains $entry.id) {
      continue
    }

    $current = $currentById[$entry.id]
    if (-not $current) {
      $currentById[$entry.id] = $entry
      continue
    }

    $currentPriority = if ($statusPriority.ContainsKey($current.status)) { $statusPriority[$current.status] } else { 0 }
    $entryPriority = if ($statusPriority.ContainsKey($entry.status)) { $statusPriority[$entry.status] } else { 0 }

    if ($entryPriority -ge $currentPriority) {
      $currentById[$entry.id] = $entry
    }
  }

  return @($currentById.Values)
}

function Get-DuplicateManualCandidates($currentEntries) {
  $persisted = @($currentEntries | Where-Object { $_.status -eq "persisted" })
  $notFound = @($currentEntries | Where-Object { $_.status -eq "not_found" })
  $candidates = @{}

  foreach ($target in $notFound) {
    $targetRow = $target.row
    $targetCenter = if ($targetRow.center) { ('{0:F6}|{1:F6}' -f [double]$targetRow.center.lat, [double]$targetRow.center.lng) } else { $null }

    foreach ($source in $persisted) {
      $sourceRow = $source.row
      $sourceCenter = if ($sourceRow.center) { ('{0:F6}|{1:F6}' -f [double]$sourceRow.center.lat, [double]$sourceRow.center.lng) } else { $null }
      $sourceRole = if ($sourceRow.role) { $sourceRow.role } elseif ($sourceRow.roles -and $sourceRow.roles.Count -gt 0) { $sourceRow.roles[0] } else { $null }

      if (-not $sourceRole) { continue }

      $sameCenter = $targetCenter -and $targetCenter -eq $sourceCenter
      $sameName = $target.baseName -and $target.baseName -eq $source.baseName
      if ($sameCenter -or $sameName) {
        $candidates[$target.id] = [pscustomobject]@{
          role = $sourceRole
          sourceId = $source.id
          sourceFile = $source.fileName
          sameCenter = $sameCenter
          sameName = $sameName
        }
        break
      }
    }
  }

  return $candidates
}

function Get-Classification($entry, $duplicateCandidates) {
  $row = $entry.row
  $resolve = $row.resolve
  $sampling = $resolve.sampling
  $coordinateSamples = if ($sampling.coordinateSamples -ne $null) { [int]$sampling.coordinateSamples } else { 0 }
  $boundsSamples = if ($sampling.boundsSamples -ne $null) { [int]$sampling.boundsSamples } else { 0 }
  $attempts = @($resolve.attempts)
  $attemptCount = $attempts.Count
  $spans = @($sampling.spans)
  $maxSpan = if ($spans.Count -gt 0) { ($spans | Measure-Object -Maximum).Maximum } else { $null }
  $maxCoordinateLabel = 0

  foreach ($attempt in $attempts) {
    if ($attempt.label -match '^coordinate-(\d+)$') {
      $index = [int]$matches[1]
      if ($index -gt $maxCoordinateLabel) { $maxCoordinateLabel = $index }
    }
  }

  $reverseDisplay = if ($null -ne $row.reverseDisplay) { [string]$row.reverseDisplay } else { "" }
  $reasons = New-Object System.Collections.Generic.List[string]

  if ($duplicateCandidates.ContainsKey($entry.id)) {
    $candidate = $duplicateCandidates[$entry.id]
    [void]$reasons.Add("Coincide con KMZ ya resuelto")
    return [pscustomobject]@{
      category = "manual-duplicate"
      priority = 1
      reasons = @($reasons)
      coordinateSamples = $coordinateSamples
      boundsSamples = $boundsSamples
      attemptCount = $attemptCount
      maxCoordinateLabel = $maxCoordinateLabel
      maxSpan = $maxSpan
      duplicate = $candidate
    }
  }

  if ($entry.status -eq "error") {
    [void]$reasons.Add("Error tecnico del endpoint")
    return [pscustomobject]@{
      category = "technical-error"
      priority = 2
      reasons = @($reasons)
      coordinateSamples = $coordinateSamples
      boundsSamples = $boundsSamples
      attemptCount = $attemptCount
      maxCoordinateLabel = $maxCoordinateLabel
      maxSpan = $maxSpan
      duplicate = $null
    }
  }

  if ($coordinateSamples -ge 12 -or $maxCoordinateLabel -ge 50) {
    [void]$reasons.Add("Muchos puntos o indices de coordenadas altos")
    if ($maxSpan -eq 0.12) {
      [void]$reasons.Add("El resolver ya expandio al span maximo")
    }

    return [pscustomobject]@{
      category = "compound-kmz"
      priority = 5
      reasons = @($reasons)
      coordinateSamples = $coordinateSamples
      boundsSamples = $boundsSamples
      attemptCount = $attemptCount
      maxCoordinateLabel = $maxCoordinateLabel
      maxSpan = $maxSpan
      duplicate = $null
    }
  }

  if ($coordinateSamples -eq 0 -and $boundsSamples -le 9) {
    [void]$reasons.Add("No hay coordenadas densas; parece predio unico")
    if ($reverseDisplay -match 'Isla|Archip|Chilo[eé]|Hualaihu[eé]|Contao|Quemay|Queilen|Quell[oó]n|Chonchi') {
      [void]$reasons.Add("Zona insular o costera donde la comuna puede ser ambigua")
    }

    return [pscustomobject]@{
      category = "single-property-retry"
      priority = 3
      reasons = @($reasons)
      coordinateSamples = $coordinateSamples
      boundsSamples = $boundsSamples
      attemptCount = $attemptCount
      maxCoordinateLabel = $maxCoordinateLabel
      maxSpan = $maxSpan
      duplicate = $null
    }
  }

  [void]$reasons.Add("Caso intermedio sin evidencia suficiente de duplicado")
  return [pscustomobject]@{
    category = "review-needed"
    priority = 4
    reasons = @($reasons)
    coordinateSamples = $coordinateSamples
    boundsSamples = $boundsSamples
    attemptCount = $attemptCount
    maxCoordinateLabel = $maxCoordinateLabel
    maxSpan = $maxSpan
    duplicate = $null
  }
}

$currentEntries = @(Get-CurrentEntries)
$duplicateCandidates = Get-DuplicateManualCandidates $currentEntries
$activeEntries = @($currentEntries | Where-Object { $_.status -in @("not_found", "error") })

$classified = foreach ($entry in $activeEntries) {
  $classification = Get-Classification $entry $duplicateCandidates
  [pscustomobject]@{
    id = $entry.id
    fileName = $entry.fileName
    status = $entry.status
    category = $classification.category
    priority = $classification.priority
    reasons = $classification.reasons
    reverseDisplay = $entry.row.reverseDisplay
    communeCode = if ($entry.row.siiCommune) { $entry.row.siiCommune.codigo } else { $null }
    communeName = if ($entry.row.siiCommune) { $entry.row.siiCommune.nombre } else { $null }
    coordinateSamples = $classification.coordinateSamples
    boundsSamples = $classification.boundsSamples
    attemptCount = $classification.attemptCount
    maxCoordinateLabel = $classification.maxCoordinateLabel
    maxSpan = $classification.maxSpan
    duplicate = $classification.duplicate
  }
}

$report = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  runDir = $RunDir
  summary = [ordered]@{
    activeRemaining = $classified.Count
    manualDuplicate = @($classified | Where-Object { $_.category -eq "manual-duplicate" }).Count
    technicalError = @($classified | Where-Object { $_.category -eq "technical-error" }).Count
    singlePropertyRetry = @($classified | Where-Object { $_.category -eq "single-property-retry" }).Count
    reviewNeeded = @($classified | Where-Object { $_.category -eq "review-needed" }).Count
    compoundKmz = @($classified | Where-Object { $_.category -eq "compound-kmz" }).Count
  }
  manualDuplicate = @($classified | Where-Object { $_.category -eq "manual-duplicate" } | Sort-Object fileName)
  technicalError = @($classified | Where-Object { $_.category -eq "technical-error" } | Sort-Object fileName)
  singlePropertyRetry = @($classified | Where-Object { $_.category -eq "single-property-retry" } | Sort-Object fileName)
  reviewNeeded = @($classified | Where-Object { $_.category -eq "review-needed" } | Sort-Object fileName)
  compoundKmz = @($classified | Where-Object { $_.category -eq "compound-kmz" } | Sort-Object fileName)
}

$report | ConvertTo-Json -Depth 10
