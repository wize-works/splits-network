# Version Management Script
# Usage: .\bump-version.ps1 [major|minor|patch]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("major", "minor", "patch")]
    [string]$Type
)

$versionFile = "VERSION"
$currentVersion = Get-Content $versionFile

$parts = $currentVersion -split '\.'
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

switch ($Type) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
    }
    "minor" {
        $minor++
        $patch = 0
    }
    "patch" {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
Set-Content $versionFile $newVersion

Write-Host "Version bumped: $currentVersion → $newVersion" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. git add VERSION" -ForegroundColor Gray
Write-Host "  2. git commit -m 'chore: bump version to $newVersion'" -ForegroundColor Gray
Write-Host "  3. git tag v$newVersion" -ForegroundColor Gray
Write-Host "  4. git push origin main --tags" -ForegroundColor Gray
