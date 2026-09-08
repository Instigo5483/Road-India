$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sourceDir = 'C:\Users\basta\OneDrive\Pictures\Road India\New folder (3)'
$items = @(Get-ChildItem -LiteralPath $sourceDir -Filter '*.jpeg' | Sort-Object Name | ForEach-Object { @{file=$_.Name;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()} })
$zipItems = @()
foreach ($zip in Get-ChildItem -LiteralPath $sourceDir -Filter '*.zip') {
  $archive = [IO.Compression.ZipFile]::OpenRead($zip.FullName)
  try { foreach ($entry in $archive.Entries) {
    if ($entry.Length -eq 0) { continue }
    $stream = $entry.Open()
    try { $hash = [Security.Cryptography.SHA256]::Create(); $digest=[BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','').ToLower() } finally { $stream.Dispose(); $hash.Dispose() }
    $zipItems += @{zip=$zip.Name;file=$entry.FullName;sha256=$digest;duplicate=($items.sha256 -contains $digest)}
  }} finally { $archive.Dispose() }
}
@{photos=$items;archives=$zipItems} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath 'D:\Files\Project\Road India\scripts\batch-inventory.local.json'
Write-Output "Photos: $($items.Count); ZIP entries: $($zipItems.Count); ZIP-only: $(@($zipItems | Where-Object { !$_.duplicate }).Count)"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime] > $null
[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime] > $null
[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime] > $null
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function AwaitOp($op,$type) { $task=$asTask.MakeGenericMethod($type).Invoke($null,@($op)); $task.Wait(); $task.Result }
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$output=@()
foreach ($item in $items) {
  $file=AwaitOp ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Join-Path $sourceDir $item.file))) ([Windows.Storage.StorageFile])
  $stream=AwaitOp ($file.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
  try {
    $decoder=AwaitOp ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap=AwaitOp ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result=AwaitOp ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    $output += @{file=$item.file;sha256=$item.sha256;text=$result.Text}
    $bitmap.Dispose()
  } finally { $stream.Dispose() }
}
$output | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath 'D:\Files\Project\Road India\scripts\batch-ocr.local.json'
Write-Output "OCR complete: $($output.Count)"
