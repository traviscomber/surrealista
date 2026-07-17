param(
  [Parameter(Mandatory = $true)]
  [string]$KmzId,
  [Parameter(Mandatory = $true)]
  [string]$Rol,
  [string]$BaseUrl = "https://sur-realista.vercel.app",
  [string]$SourceKmzId,
  [string]$SourceKmzFileName,
  [string]$EvidenceType = "manual-review",
  [string]$Notes,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$payload = @{
  kmzId = $KmzId
  rol = $Rol
  persist = (-not $DryRun)
  sourceKmzId = $(if ($SourceKmzId) { $SourceKmzId } else { $null })
  sourceKmzFileName = $(if ($SourceKmzFileName) { $SourceKmzFileName } else { $null })
  evidenceType = $EvidenceType
  notes = $(if ($Notes) { $Notes } else { $null })
} | ConvertTo-Json -Depth 8

Invoke-RestMethod `
  -Method Post `
  -Uri "$($BaseUrl.TrimEnd('/'))/api/admin/kmz/assign-role" `
  -ContentType "application/json" `
  -Body $payload `
  -TimeoutSec 120 | ConvertTo-Json -Depth 10
