# Script to compile all markdown documentation into PROJECT_SUMMARY.md
$projectRoot = "D:\Codes\alertdavao2.0.new"
$outputFile = Join-Path $projectRoot "PROJECT_SUMMARY.md"

Write-Host "Compiling all markdown documentation..." -ForegroundColor Cyan

# Get all .md files except PROJECT_SUMMARY.md and README.md
$files = Get-ChildItem -Path $projectRoot -Filter "*.md" -File -Recurse | 
    Where-Object { $_.Name -ne 'PROJECT_SUMMARY.md' -and $_.Name -ne 'README.md' } | 
    Sort-Object LastWriteTime

Write-Host "Found $($files.Count) documentation files" -ForegroundColor Yellow

# Create the header
$header = @"
# AlertDavao 2.0 - Complete Project Documentation
**Last Updated**: $(Get-Date -Format "MMMM dd, yyyy HH:mm:ss")  
**Status**: ✅ All systems operational  
**Total Documents Compiled**: $($files.Count)

---

## 📝 Update History

### November 23, 2025 - 02:30 AM
- ✅ Compiled ALL ($($files.Count)) markdown files into single source of truth
- ✅ Fixed network connection issues (IP address mismatch 192.168.1.4 → 192.168.1.11)
- ✅ Created automatic restart scripts (restart-all.bat, restart-backend.bat, etc.)
- ✅ Updated README.md with streamlined quick start guide
- ✅ Verified all services operational (Backend: 3000, UserSide: 8082)

---

## 🚀 Quick Start

### Start All Services (Easy Method)
``````bash
# Run the restart script - it will stop any running services and start fresh
restart-all.bat

# Or restart individual services:
restart-backend.bat    # Backend only
restart-userside.bat   # UserSide app only
restart-admin.bat      # Admin panel only
``````

### Manual Start
``````bash
# Backend Server
cd alertdavao2.0/UserSide/backends
npm start

# UserSide App  
cd alertdavao2.0/UserSide
npm start

# AdminSide
cd alertdavao2.0/adminSide/admin
php -S localhost:8000
``````

---

## 📋 Current Configuration

### Network Configuration
- **Machine IP**: ``192.168.1.11``
- **Backend Port**: ``3000``
- **Backend URL**: ``http://192.168.1.11:3000``
- **API URL**: ``http://192.168.1.11:3000/api``
- **Admin URL**: ``http://localhost:8000``

### Environment Files
- **UserSide**: ``.env.local`` → ``EXPO_PUBLIC_BACKEND_URL=http://192.168.1.11:3000``
- **Backend**: Listens on ``0.0.0.0:3000`` (all interfaces)
- **CORS**: Enabled for all origins (``*``)

---

## 📚 Table of Contents - All Compiled Documents

"@

# Start building the file
Set-Content -Path $outputFile -Value $header -Encoding UTF8

# Add table of contents
$toc = "`n"
$counter = 1
foreach ($file in $files) {
    $date = $file.LastWriteTime.ToString('MM/dd/yyyy HH:mm')
    $toc += "$counter. **$($file.BaseName)** - $date`n"
    $counter++
}
$toc += "`n---`n`n"

Add-Content -Path $outputFile -Value $toc -Encoding UTF8

# Add each file's content
$counter = 1
foreach ($file in $files) {
    Write-Host "Processing [$counter/$($files.Count)]: $($file.Name)" -ForegroundColor Gray
    
    $date = $file.LastWriteTime.ToString('MMMM dd, yyyy HH:mm:ss')
    $separator = @"

---

## 📄 Document #$counter : $($file.BaseName)
**File**: ``$($file.Name)``  
**Last Modified**: $date

"@
    
    Add-Content -Path $outputFile -Value $separator -Encoding UTF8
    
    # Add file content
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    if ($content) {
        Add-Content -Path $outputFile -Value $content -Encoding UTF8
    } else {
        Add-Content -Path $outputFile -Value "*[Empty file]*" -Encoding UTF8
    }
    
    Add-Content -Path $outputFile -Value "`n" -Encoding UTF8
    $counter++
}

# Add footer with instructions
$footer = @"

---

## 📝 Instructions for Future Updates

**When adding fixes or changes to this project:**

1. **DO NOT create new .md files** - Add content directly to this file
2. **Update the "Update History" section** at the top with:
   - Date and time of the change
   - Brief description of what was fixed/added
   - Files that were modified
3. **Add new content** under the appropriate section or create a new document section
4. **After making changes**, run:
   ``````bash
   restart-all.bat          # For major changes
   restart-backend.bat      # For backend changes only
   restart-userside.bat     # For UserSide app changes only
   ``````

---

## 🔄 Automatic Restart Scripts

Four batch scripts are available in the project root for easy service management:

1. **``restart-all.bat``** - Stops and restarts all services in new windows
2. **``restart-backend.bat``** - Restarts only the backend server
3. **``restart-userside.bat``** - Restarts only the UserSide app
4. **``restart-admin.bat``** - Restarts only the admin panel

**Usage**: Double-click the ``.bat`` file or run from command line

---

## 📞 Troubleshooting Commands

``````bash
# Check if backend is running
netstat -ano | findstr :3000

# Kill process on port 3000
# Get PID from netstat, then:
taskkill /PID <PID> /F

# Restart backend
cd alertdavao2.0/UserSide/backends
npm start

# Check your IP address
ipconfig | findstr "IPv4"

# Test backend connection
curl http://192.168.1.11:3000/api/test-connection
``````

---

*This file is the single source of truth for all project documentation. Always update this file instead of creating new .md files.*
*To recompile from existing .md files, run: ``.\compile-docs.ps1``*

"@

Add-Content -Path $outputFile -Value $footer -Encoding UTF8

Write-Host "`n✅ Compilation complete!" -ForegroundColor Green
Write-Host "Output: $outputFile" -ForegroundColor Cyan
Write-Host "Total documents compiled: $($files.Count)" -ForegroundColor Yellow
