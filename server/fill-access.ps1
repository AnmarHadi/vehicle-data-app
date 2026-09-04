param(
    [string]$TemplatePath,
    [string]$CsvPath
)

Write-Output "Starting..."
Write-Output "Template: $TemplatePath"
Write-Output "CSV: $CsvPath"

try {
    # التحقق من وجود الملفات
    if (-not (Test-Path $TemplatePath)) {
        Write-Output "ERROR: Template file not found"
        exit 1
    }
    
    if (-not (Test-Path $CsvPath)) {
        Write-Output "ERROR: CSV file not found"
        exit 1
    }

    # إنشاء كائن Access
    Write-Output "Creating Access COM object..."
    $access = New-Object -ComObject Access.Application
    Write-Output "Access COM object created"
    
    $access.Visible = $false
    $access.DisplayAlerts = $false

    # فتح قاعدة البيانات
    Write-Output "Opening database..."
    $access.OpenCurrentDatabase($TemplatePath)
    Write-Output "Database opened"

    # حذف البيانات القديمة
    Write-Output "Deleting old data..."
    try {
        $access.DoCmd.RunSQL("DELETE FROM informatio")
        Write-Output "Old data deleted"
    } catch {
        Write-Output "Warning: Could not delete old data: $_"
    }

    # استيراد CSV
    Write-Output "Importing CSV..."
    $access.DoCmd.TransferText(2, "", "informatio", $CsvPath, $true)
    Write-Output "CSV imported"

    # حفظ وإغلاق
    Write-Output "Closing database..."
    $access.CloseCurrentDatabase()
    $access.Quit()
    Write-Output "Database closed"

    # تحرير الكائن
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($access) | Out-Null
    [GC]::Collect()
    Write-Output "Object released"

    Write-Output "SUCCESS"
} catch {
    Write-Output "ERROR: $_"
    Write-Output "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}