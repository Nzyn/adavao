# PostgreSQL Migration Fixer
# This script converts MySQL-specific syntax to PostgreSQL-compatible syntax

$migrationsPath = "AdminSide\admin\database\migrations"

Write-Host "Converting MySQL migrations to PostgreSQL..." -ForegroundColor Cyan

# Get all migration files
$files = Get-ChildItem -Path $migrationsPath -Filter "*.php"

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace enum() with string() - PostgreSQL doesn't support native enum in migrations
    # Pattern: ->enum('column', ['value1', 'value2']) becomes ->string('column')
    $content = $content -replace "->enum\('([^']+)',\s*\[[^\]]+\]\)", "->string('`$1')"
    
    # Replace longText() with text()
    $content = $content -replace "->longText\(", "->text("
    
    # Replace mediumText() with text()
    $content = $content -replace "->mediumText\(", "->text("
    
    # Check if any changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Fixed: $($file.Name)" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host "`nTotal files modified: $totalChanges" -ForegroundColor Yellow
Write-Host "`nNOTE: enum() columns have been converted to string()." -ForegroundColor Cyan
Write-Host "You should add validation rules in your models to enforce the enum values." -ForegroundColor Cyan
