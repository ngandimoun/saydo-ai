# PowerShell script to clean Next.js lock before starting dev server
# This won't be killed by taskkill node.exe

# Get the project root (parent of scripts directory)
$projectRoot = Split-Path -Parent $PSScriptRoot
$devDir = Join-Path $projectRoot ".next\dev"
$lockPath = Join-Path $devDir "lock"
$nextDir = Join-Path $projectRoot ".next"
$logPath = Join-Path $projectRoot ".cursor\debug.log"
$cursorDir = Join-Path $projectRoot ".cursor"

# Ensure .cursor directory exists
if (-not (Test-Path $cursorDir)) {
    New-Item -ItemType Directory -Path $cursorDir -Force | Out-Null
}

function Write-Log {
    param($location, $message, $data, $hypothesisId)
    $logEntry = @{
        location = $location
        message = $message
        data = $data
        sessionId = "debug-session"
        runId = "pre-dev-ps1"
        hypothesisId = $hypothesisId
        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    } | ConvertTo-Json -Compress
    Add-Content -Path $logPath -Value $logEntry
}

Write-Host "Cleaning up before starting Next.js...`n"
Write-Log "pre-dev.ps1:31" "Starting PowerShell cleanup" @{devDir=$devDir; lockPath=$lockPath; nextDir=$nextDir} "D"

# Step 1: Kill all Node processes
Write-Log "pre-dev.ps1:34" "Killing Node processes" @{} "C"
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Log "pre-dev.ps1:38" "Killed Node processes and waited" @{} "C"
} catch {
    Write-Log "pre-dev.ps1:40" "No Node processes to kill" @{error=$_.Exception.Message} "C"
}

# Step 2: Remove entire .next directory (most aggressive cleanup)
if (Test-Path $nextDir) {
    Write-Log "pre-dev.ps1:44" "Removing entire .next directory" @{nextDir=$nextDir} "D"
    try {
        Remove-Item -Path $nextDir -Recurse -Force -ErrorAction Stop
        Write-Log "pre-dev.ps1:47" "Successfully removed .next directory" @{nextDir=$nextDir} "D"
        Write-Host "[OK] Removed .next directory (clean slate)"
    } catch {
        Write-Log "pre-dev.ps1:50" "Failed to remove .next directory" @{error=$_.Exception.Message; code=$_.Exception.HResult} "D"
        Write-Host "[ERROR] Failed to remove .next directory: $($_.Exception.Message)"
        Write-Host "[TIP] Please manually delete: Remove-Item -Path `.next -Recurse -Force"
        exit 1
    }
} else {
    Write-Log "pre-dev.ps1:56" ".next directory does not exist" @{nextDir=$nextDir} "D"
    Write-Host "[INFO] .next directory doesn't exist (already clean)"
}

# Step 3: Wait for file system to be ready
Start-Sleep -Milliseconds 1500
Write-Log "pre-dev.ps1:61" "Waited for file system, ready for Next.js" @{} "D"

Write-Host ""
Write-Log "pre-dev.ps1:64" "PowerShell cleanup complete" @{} "D"

# Explicitly return success exit code
exit 0