$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Get-UsableNode {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    try {
        $major = & $cmd.Source -e "console.log(Number(process.versions.node.split('.')[0]))"
        if ([int]$major -ge 18) { return $cmd.Source }
    }
    catch { }
    return $null
}

function Install-PortableNode {
    $version = 'v26.13.0'
    if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') {
        $arch = 'win-arm64'
    }
    elseif ([Environment]::Is64BitOperatingSystem) {
        $arch = 'win-x64'
    }
    else {
        throw '32-bit Windows is not supported by the portable package. Install Node.js 18+ from https://nodejs.org/ manually.'
    }

    $name = "node-$version-$arch"
    $url = "https://nodejs.org/dist/$version/$name.zip"
    $zip = Join-Path $Root "$name.zip"
    $dest = Join-Path $Root 'node'

    Write-Host "Downloading $url"
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $zip

    $shasumsUrl = "https://nodejs.org/dist/$version/SHASUMS256.txt"
    $shasums = (Invoke-WebRequest -UseBasicParsing -Uri $shasumsUrl).Content
    $line = ($shasums -split "`n" | Where-Object { $_ -match [regex]::Escape("$name.zip") } | Select-Object -First 1)
    if (-not $line) { throw 'Checksum entry not found for the Node.js archive.' }
    $expected = ($line -split '\s+')[0].ToLowerInvariant()
    $actual = (Get-FileHash -Algorithm SHA256 -Path $zip).Hash.ToLowerInvariant()
    if ($expected -ne $actual) { throw 'Node.js archive checksum verification failed.' }

    Write-Host 'Extracting Node.js...'
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    New-Item -ItemType Directory -Path $dest | Out-Null
    Expand-Archive -Path $zip -DestinationPath $dest -Force
    Remove-Item $zip -Force

    $node = Get-ChildItem -Path $dest -Recurse -Filter 'node.exe' | Select-Object -First 1
    if (-not $node) { throw 'node.exe was not found after extraction.' }
    Write-Host "Node.js installed: $($node.FullName)"
    return $node.FullName
}

$node = Get-UsableNode
if (-not $node) {
    Write-Host ''
    Write-Host 'Node.js 18+ was not found.'
    $answer = Read-Host 'Download a portable Node.js into this folder now? [Y/n]'
    if ($answer -match '^[Nn]') {
        Write-Host 'Install Node.js 18+ from https://nodejs.org/ and run start-proxy.bat again.'
        exit 1
    }
    $node = Install-PortableNode
}

Write-Host ''
Write-Host 'Starting DeepPCB local proxy...'
Write-Host 'Keep this window open while using the extension.'
Write-Host ''
& $node (Join-Path $Root 'deeppcb-proxy.mjs')
Write-Host ''
Write-Host 'Proxy stopped.'
