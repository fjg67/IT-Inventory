$source = $args[0]
$resDir = $args[1]

if (-not (Test-Path $source)) {
    Write-Host "Source image not found: $source" -ForegroundColor Red
    exit 1
}

Add-Type -AssemblyName System.Drawing

$configs = @(
    @{ folder="mipmap-mdpi"; size=48 },
    @{ folder="mipmap-hdpi"; size=72 },
    @{ folder="mipmap-xhdpi"; size=96 },
    @{ folder="mipmap-xxhdpi"; size=144 },
    @{ folder="mipmap-xxxhdpi"; size=192 }
)

foreach ($config in $configs) {
    $targetDir = Join-Path $resDir $config.folder
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Force -Path $targetDir | Out-Null }
    
    $targetFile = Join-Path $targetDir "ic_launcher.png"
    $targetRoundFile = Join-Path $targetDir "ic_launcher_round.png"
    
    $img = [System.Drawing.Image]::FromFile($source)
    $dim = $config.size
    
    $bm = new-object System.Drawing.Bitmap $dim, $dim
    $g = [System.Drawing.Graphics]::FromImage($bm)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($img, 0, 0, $dim, $dim)
    
    $bm.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bm.Save($targetRoundFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bm.Dispose()
    $img.Dispose()
    
    Write-Host "Generated $($config.folder) ($dim x $dim)" -ForegroundColor Green
}
