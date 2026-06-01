# Push vers GitHub pour déclencher un déploiement Cloudflare Pages (build depuis Git).
# Usage (depuis la racine chadgpt-admin) : .\scripts\deploy-push-main.ps1 -Message "fix: admin env"
# Prérequis : remote origin configuré (ex. https://github.com/issarozisoukaya/ChadGpt.git), branche main.

param(
    [string] $Message = "chore: deploy admin"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$status = git status --porcelain
if (-not $status) {
    Write-Host "Rien a committer."
    git push origin main
    exit 0
}

git add -A
git commit -m $Message
git push origin main
Write-Host "Termine. Si Cloudflare Pages est lie a ce depot, le build demarre automatiquement."
