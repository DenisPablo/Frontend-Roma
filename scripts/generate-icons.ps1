Add-Type -AssemblyName System.Drawing

function Generate-RomaIcon {
    param(
        [int]$size,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background: #0f172a
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0f172a'))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Scale factor based on 512 baseline
    $scale = $size / 512.0

    # Colors
    $goldColor = [System.Drawing.ColorTranslator]::FromHtml('#f59e0b')
    $amberColor = [System.Drawing.ColorTranslator]::FromHtml('#fbbf24')
    $goldPen = New-Object System.Drawing.Pen($goldColor, [float](14 * $scale))
    $goldPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $goldPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $goldPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $amberPen = New-Object System.Drawing.Pen($amberColor, [float](10 * $scale))
    $amberPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $amberPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Outer decorative ring
    $ringPen = New-Object System.Drawing.Pen($goldColor, [float](6 * $scale))
    $ringPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $ringRect = New-Object System.Drawing.RectangleF([float](46 * $scale), [float](46 * $scale), [float](420 * $scale), [float](420 * $scale))
    $g.DrawEllipse($ringPen, $ringRect)

    # Roman Temple / Columns
    # Top pediment line: (160, 160) to (352, 160)
    $g.DrawLine($goldPen, [float](160 * $scale), [float](160 * $scale), [float](352 * $scale), [float](160 * $scale))
    # Capital line: (170, 190) to (342, 190)
    $g.DrawLine($goldPen, [float](170 * $scale), [float](190 * $scale), [float](342 * $scale), [float](190 * $scale))
    # Base line: (190, 380) to (322, 380)
    $g.DrawLine($goldPen, [float](180 * $scale), [float](380 * $scale), [float](332 * $scale), [float](380 * $scale))

    # Left Column: (205, 190) to (205, 380)
    $g.DrawLine($goldPen, [float](205 * $scale), [float](190 * $scale), [float](205 * $scale), [float](380 * $scale))
    # Right Column: (307, 190) to (307, 380)
    $g.DrawLine($goldPen, [float](307 * $scale), [float](190 * $scale), [float](307 * $scale), [float](380 * $scale))

    # Central emblem
    $goldBrush = New-Object System.Drawing.SolidBrush($goldColor)
    $emblemRect = New-Object System.Drawing.RectangleF([float](232 * $scale), [float](261 * $scale), [float](48 * $scale), [float](48 * $scale))
    $g.FillEllipse($goldBrush, $emblemRect)

    # Laurel branches (left & right)
    $g.DrawArc($amberPen, [float](125 * $scale), [float](210 * $scale), [float](60 * $scale), [float](120 * $scale), 120, 180)
    $g.DrawArc($amberPen, [float](327 * $scale), [float](210 * $scale), [float](60 * $scale), [float](120 * $scale), 240, 180)

    # Save PNG
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $outputPath ($size x $size)"
}

$publicDir = Join-Path $PSScriptRoot "..\public"

Generate-RomaIcon -size 512 -outputPath (Join-Path $publicDir "icon-512x512.png")
Generate-RomaIcon -size 192 -outputPath (Join-Path $publicDir "icon-192x192.png")
Generate-RomaIcon -size 180 -outputPath (Join-Path $publicDir "apple-touch-icon.png")
Generate-RomaIcon -size 64  -outputPath (Join-Path $publicDir "favicon.ico")
