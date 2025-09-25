param(
  [string]$Url = "http://localhost:4000",
  [string]$Token,
  [int]$VideoId,
  [int]$Jobs = 100,
  [int]$Parallel = 6,
  [string]$Preset = "720p"
)
if (-not $Token -or -not $VideoId) {
  Write-Error "Provide -Token and -VideoId"
  exit 1
}

$Headers = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }

$scriptBlock = {
  param($Url,$Headers,$VideoId,$Preset)
  try {
    $body = @{ videoId = $VideoId; preset = $Preset } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$Url/api/jobs" -Headers $Headers -Body $body | Out-Null
    Write-Host -NoNewline "."
  } catch {
    Write-Host -NoNewline "x"
  }
}

# Launch up to $Parallel jobs at a time
$started = @()
1..$Jobs | ForEach-Object {
  while ((Get-Job -State Running).Count -ge $Parallel) { Start-Sleep -Milliseconds 100 }
  $j = Start-Job -ScriptBlock $scriptBlock -ArgumentList $Url,$Headers,$VideoId,$Preset
  $started += $j.Id
  Start-Sleep -Milliseconds 150
}

# Wait for all, then receive + clean up
Get-Job -Id $started | Wait-Job | Out-Null
Get-Job -Id $started | Receive-Job | Out-Null
Get-Job -Id $started | Remove-Job | Out-Null
Write-Host "`nDone."
