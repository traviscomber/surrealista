param(
  [string]$RunDir = "C:\Users\juanf\Documents\Codex\2026-07-15\sur\work\kmz-role-runs-fresh",
  [int]$NearDistanceMeters = 25
)

$ErrorActionPreference = "Stop"

$knownManualResolutions = @(
  [pscustomobject]@{ id = "30c98b09-08d9-4a50-b3da-03f12e23dabc"; role = "14203-66-90"; note = "Resuelto manualmente con comuna Til Til" },
  [pscustomobject]@{ id = "69766574-5fbd-489c-84c9-9ba8a0e12600"; role = "15161-3597-537"; note = "Resuelto manualmente con comuna Lo Barnechea" },
  [pscustomobject]@{ id = "34b30524-6ecb-4609-80cd-62b9d9b1c821"; role = "14202-62-193"; note = "Resuelto manualmente con comuna Lampa" },
  [pscustomobject]@{ id = "701bcf8e-3b31-40b7-aec3-89a12c2c5078"; role = "10403-141-70"; note = "Resuelto manualmente con comuna Queilen" },
  [pscustomobject]@{ id = "447e85c5-9659-41ae-a023-1a9851d37686"; role = "14202-904-45"; note = "Resuelto manualmente con comuna Lampa" }
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

function Get-DistanceMeters($aLat, $aLng, $bLat, $bLng) {
  $earthRadius = 6371000.0
  $dLat = ($bLat - $aLat) * [Math]::PI / 180
  $dLng = ($bLng - $aLng) * [Math]::PI / 180
  $sinLat = [Math]::Sin($dLat / 2)
  $sinLng = [Math]::Sin($dLng / 2)
  $a = $sinLat * $sinLat + [Math]::Cos($aLat * [Math]::PI / 180) * [Math]::Cos($bLat * [Math]::PI / 180) * $sinLng * $sinLng
  $c = 2 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1 - $a))
  return $earthRadius * $c
}

$entries = New-Object System.Collections.Generic.List[object]

Get-ChildItem -LiteralPath $RunDir -Filter "*.jsonl" -ErrorAction SilentlyContinue | ForEach-Object {
  Get-Content -LiteralPath $_.FullName | ForEach-Object {
    if (-not $_.Trim()) { return }

    try {
      $row = $_ | ConvertFrom-Json
      if (-not $row.id -or -not $row.fileName) { return }

      $lat = $null
      $lng = $null
      if ($row.center) {
        $lat = [double]$row.center.lat
        $lng = [double]$row.center.lng
      }

      $entries.Add([pscustomobject]@{
        id = $row.id
        fileName = $row.fileName
        status = $row.status
        role = if ($row.role) { $row.role } elseif ($row.roles -and $row.roles.Count -gt 0) { $row.roles[0] } else { $null }
        centerLat = $lat
        centerLng = $lng
        centerKey = if ($null -ne $lat -and $null -ne $lng) { ('{0:F6}|{1:F6}' -f $lat, $lng) } else { $null }
        communeCode = if ($row.siiCommune) { $row.siiCommune.codigo } else { $null }
        communeName = if ($row.siiCommune) { $row.siiCommune.nombre } else { $null }
        reverseDisplay = $row.reverseDisplay
        baseName = Get-NormalizedBaseName $row.fileName
        sourceLog = $_
      }) | Out-Null
    } catch {}
  }
}

$manualResolutionMap = @{}
foreach ($item in $knownManualResolutions) {
  $manualResolutionMap[$item.id] = $item
}

$statusPriority = @{
  "persisted" = 3
  "error" = 2
  "not_found" = 1
}

$currentById = @{}
foreach ($entry in $entries) {
  $current = $currentById[$entry.id]
  if (-not $current) {
    $currentById[$entry.id] = $entry
    continue
  }

  $currentPriority = if ($statusPriority.ContainsKey($current.status)) { $statusPriority[$current.status] } else { 0 }
  $entryPriority = if ($statusPriority.ContainsKey($entry.status)) { $statusPriority[$entry.status] } else { 0 }

  if ($entryPriority -gt $currentPriority) {
    $currentById[$entry.id] = $entry
  }
}

$currentEntries = @()
foreach ($entry in $currentById.Values) {
  if ($manualResolutionMap.ContainsKey($entry.id)) {
    $resolution = $manualResolutionMap[$entry.id]
    $currentEntries += [pscustomobject]@{
      id = $entry.id
      fileName = $entry.fileName
      status = "persisted-manual"
      role = $resolution.role
      centerLat = $entry.centerLat
      centerLng = $entry.centerLng
      centerKey = $entry.centerKey
      communeCode = $entry.communeCode
      communeName = $entry.communeName
      reverseDisplay = $entry.reverseDisplay
      baseName = $entry.baseName
      sourceLog = $entry.sourceLog
      note = $resolution.note
    }
    continue
  }

  $currentEntries += $entry
}

$persisted = @($currentEntries | Where-Object { $_.status -in @("persisted", "persisted-manual") -and $_.role })
$notFound = @($currentEntries | Where-Object { $_.status -eq "not_found" })
$errors = @($currentEntries | Where-Object { $_.status -eq "error" })
$manualResolved = @($currentEntries | Where-Object { $_.status -eq "persisted-manual" })

$exactCenterCandidates = foreach ($target in $notFound) {
  foreach ($source in $persisted) {
    if ($target.centerKey -and $target.centerKey -eq $source.centerKey) {
      [pscustomobject]@{
        matchType = "exact-center"
        targetId = $target.id
        targetFile = $target.fileName
        sourceId = $source.id
        sourceFile = $source.fileName
        role = $source.role
        communeCode = $source.communeCode
        communeName = $source.communeName
        reverseDisplay = $target.reverseDisplay
      }
    }
  }
}

$nameVariantCandidates = foreach ($target in $notFound) {
  foreach ($source in $persisted) {
    if ($target.baseName -and $target.baseName -eq $source.baseName) {
      [pscustomobject]@{
        matchType = "name-variant"
        targetId = $target.id
        targetFile = $target.fileName
        sourceId = $source.id
        sourceFile = $source.fileName
        role = $source.role
        communeCode = $source.communeCode
        communeName = $source.communeName
        reverseDisplay = $target.reverseDisplay
      }
    }
  }
}

$nearCenterCandidates = foreach ($target in $notFound) {
  if ($null -eq $target.centerLat -or $null -eq $target.centerLng) { continue }

  foreach ($source in $persisted) {
    if ($null -eq $source.centerLat -or $null -eq $source.centerLng) { continue }
    if ($target.id -eq $source.id) { continue }
    if ($target.communeCode -and $source.communeCode -and $target.communeCode -ne $source.communeCode) { continue }

    $distance = Get-DistanceMeters $target.centerLat $target.centerLng $source.centerLat $source.centerLng
    if ($distance -le $NearDistanceMeters) {
      [pscustomobject]@{
        matchType = "near-center"
        targetId = $target.id
        targetFile = $target.fileName
        sourceId = $source.id
        sourceFile = $source.fileName
        role = $source.role
        communeCode = $source.communeCode
        communeName = $source.communeName
        distanceMeters = [Math]::Round($distance, 2)
      }
    }
  }
}

$report = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  runDir = $RunDir
  summary = [ordered]@{
    persisted = $persisted.Count
    notFound = $notFound.Count
    errors = $errors.Count
    manualResolved = $manualResolved.Count
    exactCenterCandidates = @($exactCenterCandidates).Count
    nameVariantCandidates = @($nameVariantCandidates).Count
    nearCenterCandidates = @($nearCenterCandidates).Count
  }
  exactCenterCandidates = @($exactCenterCandidates | Sort-Object targetFile, sourceFile)
  nameVariantCandidates = @($nameVariantCandidates | Sort-Object targetFile, sourceFile)
  nearCenterCandidates = @($nearCenterCandidates | Sort-Object distanceMeters, targetFile, sourceFile)
  manualResolved = @($manualResolved | Sort-Object fileName | Select-Object id, fileName, role, note)
  technicalErrors = @($errors | Sort-Object fileName | Select-Object id, fileName, reverseDisplay, communeCode, communeName)
}

$report | ConvertTo-Json -Depth 8
